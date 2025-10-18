import { MdDelete } from "react-icons/md";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { UploadFileItem } from "~/hooks/useFileUpload";

interface FileUploadSectionProps {
  fileList: UploadFileItem[];
  removeFile: (uid: string) => void;
}

export function FileUploadSection({
  fileList,
  removeFile,
}: FileUploadSectionProps) {

  if (fileList.length === 0) {
    return null;
  }

  return (
    <div className="px-12 py-8">
      <Carousel>
        <CarouselContent className="">
          {fileList.map((file) => (
            <CarouselItem key={file.uid} className="">
              <Card className="p-1 px-0">
                <CardContent className="p-1">
                  <div className="flex justify-end gap-1 pb-1">
                    <Badge variant={"outline"}>
                      {file.status}
                    </Badge>
                    <Button
                      size={"sm"}
                      variant={"ghost"}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!file?.uid) return;
                        removeFile(file?.uid);
                      }}
                    >
                      <MdDelete />
                    </Button>
                  </div>
                  <img
                    className="h-full object-cover"
                    src={file.URL}
                    alt={file?.FileName}
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}