import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Accordion = ({ children, className, defaultValue, type }) => {
  return <div className={cn("space-y-2", className)}>{children}</div>
}

const AccordionItem = ({ children, className, value }) => {
  return <div className={cn("border-b", className)}>{children}</div>
}

const AccordionTrigger = ({ children, className }) => {
  return (
    <button className={cn("flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", className)}>
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  )
}

const AccordionContent = ({ children, className }) => {
  return <div className={cn("overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down", className)}>{children}</div>
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
