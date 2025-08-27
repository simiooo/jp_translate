// src/pages/Recognize.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import CameraPreview from "~/components/CameraPreview";
import { RiCameraLensFill } from "react-icons/ri";
import { MdOutlineFlipCameraAndroid } from "react-icons/md";
import { useRequest } from "ahooks";
import { Modal, useModal } from "~/components/ModalCompat";

export default function Recognize() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const {isOpen, closeModal, openModal} = useModal()
  const shotRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>("");
  const [photos, setPhotos] = useState<Blob[]>([]);

  const { data: renderPhoto } = useRequest(
    async () => {
      if (renderPhoto) {
        URL.revokeObjectURL(renderPhoto);
      }
      if(photos.length === 0) return
      const url = URL.createObjectURL(photos[photos.length - 1]);
      return url;
    },
    {
      refreshDeps: [photos],
    }
  );

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await window.navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStream(stream);
        }
      } catch (err) {
        setError(`无法访问相机${err}`);
        console.error(err);
      }
    };
    initCamera();
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [facingMode]);

  const handleCapture = useCallback(async () => {
    if (videoRef.current) {
      const canvas = new OffscreenCanvas(
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);
      // 这里可以添加图片处理逻辑
      const blob = await canvas.convertToBlob({
        quality: 1,
      });
      shotRef.current?.animate(
        [
          {
            background: "#222",
          },
          {
            background: "#aaa",
          },
          {
            background: "#222",
          },
        ],
        { duration: 350, easing: "cubic-bezier(0.42, 0, 0.58, 1)" }
      );
      setPhotos([...photos, blob]);
    }
  }, [photos]);

  return (
    <div className="flex flex-col h-full dark:bg-gray-900">
      <CameraPreview className="grow bg-gray-900 dark:bg-gray-900">
        {error ? (
          <div
            className="
            w-full h-full
            text-red-500"
          >
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </CameraPreview>

      <div className=" basis-[6rem] bg-white dark:bg-gray-800 flex justify-center items-center gap-4">
        <div className="mr-8">
          <div
            ref={shotRef}
            onClick={() => {
                if(!renderPhoto)return
                openModal()
            }}
            className={`w-8 h-14 overflow-hidden rounded-lg bg-gray-900 dark:bg-gray-700`}
          >
            <img className="w-full h-full object-cover" src={renderPhoto} alt="asd" />
          </div>
        </div>
        <Button size="lg" onClick={handleCapture}>
          <RiCameraLensFill
            style={{
              fontSize: "2rem",
            }}
          ></RiCameraLensFill>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setFacingMode(facingMode === "user" ? "environment" : "user");
          }}
        >
          <MdOutlineFlipCameraAndroid />
        </Button>
        <div className="w-0 h-0"></div>
      </div>
      <Modal
      title=""
      isOpen={isOpen}
      onClose={() => [
        closeModal()
      ]}
      >
        <img src={renderPhoto} alt="" />
      </Modal>
    </div>
  );
}
