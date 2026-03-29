import type { ComponentType, HTMLAttributes } from "react";

type IconProps = HTMLAttributes<HTMLSpanElement>;

function InlineSvgIcon({
  markup,
  className,
  ...props
}: IconProps & { markup: string }) {
  return (
    <span
      data-inline-icon="true"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup }}
      {...props}
    />
  );
}

export type LocalIcon = ComponentType<IconProps>;

const menuSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5l14 0M5 19l14 0M5 12h14"><animate fill="freeze" attributeName="d" dur="0.4s" values="M5 5l14 14M5 19l14 -14M12 12h0;M5 5l14 0M5 19l14 0M5 12h14"/></path></svg>`;
const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-dasharray="12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12l7 7M12 12l-7 -7M12 12l-7 7M12 12l7 -7"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="12;0"/></path></svg>`;
const arrowLeftSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="20" d="M21 12h-17.5"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="20;0"/></path><path stroke-dasharray="12" stroke-dashoffset="12" d="M3 12l7 7M3 12l7 -7"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.3s" dur="0.2s" to="0"/></path></g></svg>`;
const arrowRightSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="20" d="M3 12h17.5"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="20;0"/></path><path stroke-dasharray="12" stroke-dashoffset="12" d="M21 12l-7 7M21 12l-7 -7"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.3s" dur="0.2s" to="0"/></path></g></svg>`;
const arrowUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="20" d="M12 21l0 -17.5"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="20;0"/></path><path stroke-dasharray="12" stroke-dashoffset="12" d="M12 3l7 7M12 3l-7 7"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.3s" dur="0.2s" to="0"/></path></g></svg>`;
const volumeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="currentColor"><path fill-opacity="0" stroke="currentColor" stroke-dasharray="34" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 10h3.5l3.5 -3.5v10.5l-3.5 -3.5h-3.5Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="34;0"/><animate fill="freeze" attributeName="fill-opacity" begin="0.8s" dur="0.15s" to="0.3"/></path><path d="M14 12c0 0 0 0 0 0c0 0 0 0 0 0Z"><animate fill="freeze" attributeName="d" begin="0.4s" dur="0.2s" to="M14 16c1.5 -0.71 2.5 -2.24 2.5 -4c0 -1.77 -1 -3.26 -2.5 -4Z"/></path><path d="M14 12c0 0 0 0 0 0c0 0 0 0 0 0v0c0 0 0 0 0 0c0 0 0 0 0 0Z"><animate fill="freeze" attributeName="d" begin="0.4s" dur="0.4s" to="M14 3.23c4 0.91 7 4.49 7 8.77c0 4.28 -3 7.86 -7 8.77v-2.07c2.89 -0.86 5 -3.53 5 -6.7c0 -3.17 -2.11 -5.85 -5 -6.71Z"/></path></g></svg>`;
const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="18" d="M21 5l-2.5 15M21 5l-12 8.5"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="18;0"/></path><path stroke-dasharray="24" d="M21 5l-19 7.5"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="24;0"/></path><path stroke-dasharray="14" stroke-dashoffset="14" d="M18.5 20l-9.5 -6.5"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.3s" to="0"/></path><path stroke-dasharray="10" stroke-dashoffset="10" d="M2 12.5l7 1"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.3s" to="0"/></path><path stroke-dasharray="8" stroke-dashoffset="8" d="M12 16l-3 3M9 13.5l0 5.5"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.3s" to="0"/></path></g></svg>`;
const copySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-opacity="0" d="M6 4h4v2h4v-2h4v16h-12v-16Z"><animate fill="freeze" attributeName="fill-opacity" begin="0.9s" dur="0.15s" to="0.3"/></path><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path stroke-dasharray="66" stroke-width="2" d="M12 3h7v18h-14v-18h7Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="66;0"/></path><path stroke-dasharray="14" stroke-dashoffset="14" d="M14.5 3.5v3h-5v-3"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" to="0"/></path></g></svg>`;
const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-opacity="0" d="M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9c0 0 -7.43 -7.79 -8.24 -9c-0.48 -0.71 -0.76 -1.57 -0.76 -2.5c0 -2.49 2.01 -4.5 4.5 -4.5c1.56 0 2.87 0.84 3.74 2c0.76 1 0.76 1 0.76 1Z"><animate fill="freeze" attributeName="fill-opacity" begin="0.6s" dur="0.4s" to="1"/></path><path fill="none" stroke="currentColor" stroke-dasharray="30" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c0 0 0 0 -0.76 -1c-0.88 -1.16 -2.18 -2 -3.74 -2c-2.49 0 -4.5 2.01 -4.5 4.5c0 0.93 0.28 1.79 0.76 2.5c0.81 1.21 8.24 9 8.24 9M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="30;0"/></path></svg>`;
const systemThemeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-opacity="0" stroke="currentColor" stroke-dasharray="60" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12c0 -4.97 4.03 -9 9 -9c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="60;0"/><animate fill="freeze" attributeName="fill-opacity" begin="0.6s" dur="0.4s" to="1"/></path></svg>`;
const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><defs><mask id="SVGvG6RIdLi"><path fill="#fff" d="M12 6c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z"><animate fill="freeze" attributeName="d" dur="0.4s" values="M12 2c5.52 0 10 4.48 10 10c0 5.52 -4.48 10 -10 10c-5.52 0 -10 -4.48 -10 -10c0 -5.52 4.48 -10 10 -10Z;M12 6c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z"/></path><path d="M22 -4c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z"><animate fill="freeze" attributeName="d" dur="0.4s" values="M18 -4c5.52 0 10 4.48 10 10c0 5.52 -4.48 10 -10 10c-5.52 0 -10 -4.48 -10 -10c0 -5.52 4.48 -10 10 -10Z;M22 -4c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z"/><set fill="freeze" attributeName="opacity" begin="0.4s" to="0"/></path></mask></defs><path fill="currentColor" d="M0 0h24v24H0z" mask="url(#SVGvG6RIdLi)"/><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 21v1M21 12h1M12 3v-1M3 12h-1" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.4s" to="1"/><animate fill="freeze" attributeName="d" begin="0.4s" dur="0.2s" values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1"/></path><path d="M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.6s" to="1"/><animate fill="freeze" attributeName="d" begin="0.6s" dur="0.2s" values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"/></path></g></svg>`;
const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><defs><mask id="SVGnw0mAdjE"><path fill="#fff" d="M12 2c5.52 0 10 4.48 10 10c0 5.52 -4.48 10 -10 10c-5.52 0 -10 -4.48 -10 -10c0 -5.52 4.48 -10 10 -10Z"><animate fill="freeze" attributeName="d" dur="0.4s" values="M12 6c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z;M12 2c5.52 0 10 4.48 10 10c0 5.52 -4.48 10 -10 10c-5.52 0 -10 -4.48 -10 -10c0 -5.52 4.48 -10 10 -10Z"/><set fill="freeze" attributeName="opacity" begin="0.4s" to="0"/></path><path d="M18 -4c5.52 0 10 4.48 10 10c0 5.52 -4.48 10 -10 10c-5.52 0 -10 -4.48 -10 -10c0 -5.52 4.48 -10 10 -10Z"><animate fill="freeze" attributeName="d" dur="0.4s" values="M22 -4c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z;M18 -4c5.52 0 10 4.48 10 10c0 5.52 -4.48 10 -10 10c-5.52 0 -10 -4.48 -10 -10c0 -5.52 4.48 -10 10 -10Z"/><set fill="freeze" attributeName="opacity" begin="0.4s" to="0"/></path></mask></defs><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21v1M21 12h1M12 3v-1M3 12h-1M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"><animate fill="freeze" attributeName="opacity" dur="0.4s" values="1;0"/></path><g fill="currentColor"><path d="M0 0h24v24H0z" mask="url(#SVGnw0mAdjE)"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6c0 6.08 4.92 11 11 11c0.53 0 1.05 -0.04 1.56 -0.11c-1.61 2.47 -4.39 4.11 -7.56 4.11c-4.97 0 -9 -4.03 -9 -9c0 -3.17 1.64 -5.95 4.11 -7.56c-0.07 0.51 -0.11 1.03 -0.11 1.56Z" opacity="0"><set fill="freeze" attributeName="opacity" begin="0.4s" to="1"/></path></g><g fill="none" stroke="currentColor" stroke-dasharray="4" stroke-dashoffset="4" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M12 5h1.5M12 5h-1.5M12 5v1.5M12 5v-1.5"><animate attributeName="stroke-dashoffset" begin="0.4s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path><path d="M17 11h1.5M17 11h-1.5M17 11v1.5M17 11v-1.5"><animate attributeName="stroke-dashoffset" begin="1.07s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path><path d="M20 5h1.5M20 5h-1.5M20 5v1.5M20 5v-1.5"><animate attributeName="stroke-dashoffset" begin="1.74s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path><path d="M12 4h1.5M12 4h-1.5M12 4v1.5M12 4v-1.5"><animate attributeName="stroke-dashoffset" begin="2.41s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path><path d="M18 12h1.5M18 12h-1.5M18 12v1.5M18 12v-1.5"><animate attributeName="stroke-dashoffset" begin="3.08s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path><path d="M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5"><animate attributeName="stroke-dashoffset" begin="3.75s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path><path d="M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5"><animate attributeName="stroke-dashoffset" begin="4.42s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path><path d="M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5"><animate attributeName="stroke-dashoffset" begin="5.09s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path><path d="M20 5h1.5M20 5h-1.5M20 5v1.5M20 5v-1.5"><animate attributeName="stroke-dashoffset" begin="5.76s" dur="6s" keyTimes="0;0.08;0.22;0.3;1" repeatCount="indefinite" values="4;0;0;4;4"/></path></g></svg>`;

export function MenuIcon(props: IconProps) {
  return <InlineSvgIcon markup={menuSvg} {...props} />;
}

export function CloseIcon(props: IconProps) {
  return <InlineSvgIcon markup={closeSvg} {...props} />;
}

export function ArrowLeftIcon(props: IconProps) {
  return <InlineSvgIcon markup={arrowLeftSvg} {...props} />;
}

export function ArrowRightIcon(props: IconProps) {
  return <InlineSvgIcon markup={arrowRightSvg} {...props} />;
}

export function ArrowUpIcon(props: IconProps) {
  return <InlineSvgIcon markup={arrowUpSvg} {...props} />;
}

export function VolumeIcon(props: IconProps) {
  return <InlineSvgIcon markup={volumeSvg} {...props} />;
}

export function ShareIcon(props: IconProps) {
  return <InlineSvgIcon markup={shareSvg} {...props} />;
}

export function CopyIcon(props: IconProps) {
  return <InlineSvgIcon markup={copySvg} {...props} />;
}

export function HeartIcon(props: IconProps) {
  return <InlineSvgIcon markup={heartSvg} {...props} />;
}

export function SystemThemeIcon(props: IconProps) {
  return <InlineSvgIcon markup={systemThemeSvg} {...props} />;
}

export function SunIcon(props: IconProps) {
  return <InlineSvgIcon markup={sunSvg} {...props} />;
}

export function MoonIcon(props: IconProps) {
  return <InlineSvgIcon markup={moonSvg} {...props} />;
}
