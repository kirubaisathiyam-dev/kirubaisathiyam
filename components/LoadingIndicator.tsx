import { LoadingIcon } from "@/components/Icons";

type LoadingIndicatorProps = {
  className?: string;
  size?: number;
};

export default function LoadingIndicator({
  className,
  size = 28,
}: LoadingIndicatorProps) {
  return (
    <div className={`flex items-center justify-center ${className || ""}`}>
      <LoadingIcon
        style={{
          width: size,
          height: size,
          color: "var(--muted-foreground)",
        }}
      />
    </div>
  );
}
