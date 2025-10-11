"use client";

import * as React from "react";
import {
  Content,
  Group,
  Icon,
  Item,
  ItemIndicator,
  ItemText,
  Label,
  Portal,
  Root,
  ScrollDownButton,
  ScrollUpButton,
  SelectProps,
  Trigger,
  Value,
  Viewport,
} from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

import { cn } from "@/lib/ui";

const Select = Root;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof Trigger>,
  React.ComponentPropsWithoutRef<typeof Trigger>
>(({ className, children, ...props }, ref) => (
  <Trigger
    ref={ref}
    className={cn(
      "flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-slate-300/50",
      className,
    )}
    {...props}
  >
    {children}
    <Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-80" />
    </Icon>
  </Trigger>
));
SelectTrigger.displayName = Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof Content>,
  React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <Portal>
    <Content
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 text-slate-100 shadow-2xl shadow-slate-950/50 backdrop-blur-xl",
        className,
      )}
      position={position}
      {...props}
    >
      <ScrollUpButton className="flex h-8 cursor-default items-center justify-center text-violet-200/75">
        <ChevronUp className="h-4 w-4" />
      </ScrollUpButton>
      <Viewport className="p-2">{children}</Viewport>
      <ScrollDownButton className="flex h-8 cursor-default items-center justify-center text-violet-200/75">
        <ChevronDown className="h-4 w-4" />
      </ScrollDownButton>
    </Content>
  </Portal>
));
SelectContent.displayName = Content.displayName;

const SelectGroup = Group;
const SelectLabel = Label;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof Item>,
  React.ComponentPropsWithoutRef<typeof Item>
>(({ className, children, ...props }, ref) => (
  <Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition hover:bg-slate-800/60 focus:bg-slate-800/70 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <ItemIndicator className="absolute left-2 flex h-4 w-4 items-center justify-center text-violet-300">
      <Check className="h-3 w-3" />
    </ItemIndicator>
    <ItemText>{children}</ItemText>
  </Item>
));
SelectItem.displayName = Item.displayName;

const SelectValue = Value;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  type SelectProps,
};
