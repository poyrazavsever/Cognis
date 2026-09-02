"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { Icon } from "@/components/app-icon";

type AnimatedButtonVariant = "primary" | "outline";
type AnimatedButtonIconPosition = "left" | "right";

type AnimatedButtonBaseProps = {
  children: ReactNode;
  icon: string;
  iconPosition?: AnimatedButtonIconPosition;
  variant?: AnimatedButtonVariant;
  className?: string;
  ariaLabel?: string;
};

type AnimatedButtonAnchorProps = AnimatedButtonBaseProps & {
  href: string;
  target?: string;
  rel?: string;
  type?: never;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

type AnimatedButtonNativeProps = AnimatedButtonBaseProps & {
  href?: undefined;
  target?: never;
  rel?: never;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

type AnimatedButtonProps = AnimatedButtonAnchorProps | AnimatedButtonNativeProps;

const variantClasses: Record<AnimatedButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(220,38,38,0.24)] hover:bg-primary-hover hover:shadow-[0_14px_30px_rgba(220,38,38,0.3)]",
  outline:
    "border border-border bg-background text-foreground shadow-sm hover:border-border-strong hover:bg-accent",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isAnchorButton(
  props: AnimatedButtonProps,
): props is AnimatedButtonAnchorProps {
  return typeof props.href === "string";
}

function AnimatedIcon({
  icon,
  position,
}: {
  icon: string;
  position: AnimatedButtonIconPosition;
}) {
  const incomingOffset =
    position === "right"
      ? "-translate-x-3 translate-y-4"
      : "translate-x-3 translate-y-4";

  return (
    <span className="relative grid h-5 w-5 shrink-0 place-items-center overflow-hidden">
      <Icon
        icon={icon}
        className="absolute h-5 w-5 transition-all duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-5 group-hover:opacity-0"
      />
      <Icon
        icon="mdi:arrow-top-right"
        className={cn(
          "absolute h-5 w-5 opacity-0 transition-all duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100",
          incomingOffset,
        )}
      />
    </span>
  );
}

export function AnimatedButton(props: AnimatedButtonProps) {
  const {
    children,
    icon,
    iconPosition = "right",
    variant = "primary",
    className,
    ariaLabel,
  } = props;

  const classes = cn(
    "group inline-flex h-11 items-center justify-center gap-3 rounded-2xl px-5 text-sm font-semibold transition-all duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 active:translate-y-0",
    variantClasses[variant],
    className,
  );

  const content = (
    <>
      {iconPosition === "left" ? (
        <AnimatedIcon icon={icon} position={iconPosition} />
      ) : null}
      <span>{children}</span>
      {iconPosition === "right" ? (
        <AnimatedIcon icon={icon} position={iconPosition} />
      ) : null}
    </>
  );

  if (isAnchorButton(props)) {
    return (
      <a
        href={props.href}
        target={props.target}
        rel={props.rel}
        aria-label={ariaLabel}
        onClick={props.onClick}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      aria-label={ariaLabel}
      onClick={props.onClick}
      className={classes}
    >
      {content}
    </button>
  );
}
