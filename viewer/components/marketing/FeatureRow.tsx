import Image from "next/image";
import { cn } from "@/lib/utils";

export interface FeatureRowProps {
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  image: { src: string; alt: string; width: number; height: number };
  reverse?: boolean | undefined;
  wide?: boolean | undefined;
}

interface FeatureCopyProps {
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
}

function FeatureCopy({ index, eyebrow, title, body, bullets }: FeatureCopyProps) {
  return (
    <>
      <p className="flex items-baseline gap-2 font-mono text-[9.5px] tracking-[.09em] uppercase">
        <span className="text-faint">{index}</span>
        <span className="text-line-strong" aria-hidden>
          /
        </span>
        <span className="text-faint">{eyebrow}</span>
      </p>
      <h2 className="mt-3 text-[28px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance text-ink">
        {title}
      </h2>
      <p className="mt-3.5 text-[13.5px] leading-[1.65] text-muted">{body}</p>
      <ul className="mt-5 list-disc space-y-1.5 pl-4 text-[12.5px] leading-[1.55] text-ink-2 marker:text-faint">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </>
  );
}

export function FeatureRow({
  index,
  eyebrow,
  title,
  body,
  bullets,
  image,
  reverse,
  wide,
}: FeatureRowProps) {
  if (wide) {
    return (
      <article className="border-t border-line py-16 lg:py-20">
        <div className="max-w-[680px]">
          <FeatureCopy
            index={index}
            eyebrow={eyebrow}
            title={title}
            body={body}
            bullets={bullets}
          />
        </div>
        <div className="media-frame mt-10 overflow-hidden rounded-[6px] border border-line">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            unoptimized
            sizes="(min-width: 1180px) 1140px, 100vw"
            className="h-auto w-full"
          />
        </div>
      </article>
    );
  }

  return (
    <article className="grid gap-10 border-t border-line py-16 lg:grid-cols-12 lg:gap-14 lg:py-20">
      <div className={cn("lg:col-span-5", reverse && "lg:order-2")}>
        <FeatureCopy
          index={index}
          eyebrow={eyebrow}
          title={title}
          body={body}
          bullets={bullets}
        />
      </div>

      <div
        className={cn(
          "media-frame overflow-hidden rounded-[6px] border border-line lg:col-span-7",
          reverse && "lg:order-1",
        )}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          unoptimized
          sizes="(min-width: 1024px) 640px, 100vw"
          className="h-auto w-full"
        />
      </div>
    </article>
  );
}

export default FeatureRow;
