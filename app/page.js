import HeroPage from "./(main)/hero/page";
import Featured from "./(main)/featured/page";

// Featured pulls live listings from the DB/cache, so render at request time.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
    <HeroPage />
    <Featured />
    </>
  );
}