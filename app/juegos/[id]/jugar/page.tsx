import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GAMES } from "@/lib/data";
import { GamePlayer } from "@/components/game-player";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export async function generateMetadata(
  props: PageProps<"/juegos/[id]/jugar">,
): Promise<Metadata> {
  const { id } = await props.params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) return {};
  return { title: `Jugando ${game.title} · Arcade Vault`, description: game.short };
}

export default async function PlayPage(props: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await props.params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
