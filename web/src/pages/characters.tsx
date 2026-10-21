/**
 * pages/characters.tsx - "My characters" (/characters).
 *
 * Characters belong to you and work without a campaign. Each can also be in one
 * campaign, where its DM can open it and its homebrew applies; the "Campaign"
 * button on a card moves it in, between or out of campaigns.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { Flag, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, NativeSelect, Options } from '@/components/fields';
import { useConfirm } from '@/components/confirm';
import { Empty, ErrorState, Loading, PageHead, RequireUser } from '@/components/page';
import { api, errorMessage, type CharacterSummary } from '@/lib/api';
import { useApi } from '@/lib/catalog';
import { useSession } from '@/lib/session';

export default function Characters() {
  return <RequireUser what="see your characters"><CharacterList /></RequireUser>;
}

function CharacterList() {
  const { groups } = useSession();
  const confirm = useConfirm();
  const { data, error, reload } = useApi<{ characters: CharacterSummary[] }>('/characters');
  const [moving, setMoving] = useState<CharacterSummary | null>(null);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const characters = data.characters;

  // Sections: one per campaign you have characters in, then the ones in no campaign.
  const sections = [
    ...groups.map((g) => ({ g, list: characters.filter((c) => c.groupId === g.id) })),
    { g: null, list: characters.filter((c) => !c.groupId || !groups.some((g) => g.id === c.groupId)) },
  ].filter((x) => x.list.length);

  const remove = async (c: CharacterSummary) => {
    if (!await confirm({ title: 'Delete character?', message: `"${c.name}" will be permanently deleted. This cannot be undone.`, confirmLabel: 'Delete', danger: true })) return;
    try { await api('DELETE', `/characters/${c.id}`); toast.success('Character deleted.'); reload(); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <>
      <PageHead kicker="Saved to your account" title="My characters"
        actions={<Button asChild><Link to="/characters/new"><Plus />New character</Link></Button>} />
      {sections.length ? sections.map(({ g, list }) => (
        <section key={g?.id ?? 'none'} className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-2xl font-bold">{g ? <><Flag className="size-5 text-gold-ink" />{g.name}</> : 'Not in a campaign'}</h2>
            {g && <Button asChild variant="ghost" size="sm"><Link to={`/campaign/${g.id}`}>Enter campaign</Link></Button>}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {list.map((c) => (
              <article key={c.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <p className="kicker">Level {c.level} {c.className || 'Adventurer'}</p>
                <h3 className="mt-1 text-xl font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[c.species, c.subclass].filter(Boolean).join(' · ') || 'No species set'}<br />
                  Last saved {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm"><Link to={`/characters/${c.id}`}>Open sheet</Link></Button>
                  {groups.length > 0 && <Button size="sm" variant="outline" onClick={() => setMoving(c)}><Flag />Campaign</Button>}
                  <Button size="icon" variant="ghost" className="ml-auto size-8 text-destructive hover:text-destructive" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}><Trash2 /></Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )) : (
        <Empty icon={<Users />} title="No characters yet" action={<Button asChild><Link to="/characters/new"><Plus />Create a character</Link></Button>}>
          Create your first Compositor. The <Link className="underline" to="/guide">character guide</Link> walks through every step.
          You do not need a campaign; you can add the character to one later.
        </Empty>
      )}
      {moving && <ChooseCampaign c={moving} onClose={(changed) => { setMoving(null); if (changed) reload(); }} />}
    </>
  );
}

/** Put a character into one of your campaigns, move it, or take it out. */
function ChooseCampaign({ c, onClose }: { c: CharacterSummary; onClose: (changed: boolean) => void }) {
  const { groups } = useSession();
  const [value, setValue] = useState(c.groupId ?? '');
  const save = async () => {
    try { await api('PUT', `/characters/${c.id}/campaign`, { groupId: value || null }); toast.success('Saved.'); onClose(true); }
    catch (err) { toast.error(errorMessage(err)); }
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(false); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Campaign for {c.name}</DialogTitle>
          <DialogDescription>In a campaign, its DM can open and edit the sheet, and the campaign's homebrew applies to it. A character is in one campaign at a time.</DialogDescription>
        </DialogHeader>
        <Field label="Campaign" htmlFor="pick-campaign">
          <NativeSelect id="pick-campaign" value={value} onChange={(e) => setValue(e.target.value)}>
            <Options options={[{ value: '', label: 'No campaign' }, ...groups.map((g) => ({ value: g.id, label: g.name }))]} />
          </NativeSelect>
        </Field>
        <DialogFooter><Button variant="outline" onClick={() => onClose(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
