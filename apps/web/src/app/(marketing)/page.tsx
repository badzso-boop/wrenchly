import type { Metadata } from "next";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "Wrenchly - Marketing",
  description: "Welcome to Wrenchly",
};

export default async function MarketingPage() {
  const session = await getServerSession();

  return (
    <div className="marketing-page">
      <section className="hero">
        <h1>Welcome to Wrenchly</h1>
        {session && <p>Signed in as {session.user?.email}</p>}
      </section>
    </div>
  );
}