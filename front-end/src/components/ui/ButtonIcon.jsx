import { ChevronRight, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/Button"

export function ButtonIcon(props) {
  return (
    <Button variant="outline" size="icon" {...props}>
      {props.direction === "right" ? <ChevronRight /> : <ChevronLeft />}
    </Button>
  )
}
