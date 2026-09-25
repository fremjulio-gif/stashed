import { Metadata } from "next";
import { getShareLinkByToken } from "@/lib/db";
import PublicShareViewer from "./PublicShareViewer";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const share = await getShareLinkByToken(token);

  if (!share || !share.isActive) {
    return {
      title: "Lien Stashed Introuvable",
      description: "Ce lien de partage n'existe pas ou a été désactivé.",
    };
  }

  const title =
    share.project?.title ||
    share.track?.title ||
    "Session Audio Partagée • Stashed";
  const description =
    share.project?.description ||
    `Écoutez "${title}" en haute résolution master audio sur Stashed.`;
  const image =
    share.project?.coverImageUrl ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop";

  return {
    title: `${title} | Stashed Audio`,
    description,
    openGraph: {
      title: `${title} | Stashed`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Stashed`,
      description,
      images: [image],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  return <PublicShareViewer token={token} />;
}
