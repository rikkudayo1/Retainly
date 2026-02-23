import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { CloudIcon } from "lucide-react"

interface EmptyViewProps {
  onUploadClick: () => void
}

export function EmptyView({ onUploadClick }: EmptyViewProps) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudIcon />
        </EmptyMedia>
        <EmptyTitle>No Files Uploaded</EmptyTitle>
        <EmptyDescription>
          Upload a text file to get started. We'll generate a summary, key concepts, and a quiz for you.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onUploadClick}>
          Upload Files
        </Button>
      </EmptyContent>
    </Empty>
  )
}