import {
  FaWindowMinimize,
  FaWindowMaximize,
  FaTimes,
  FaHome,
  FaBookmark,
  FaCameraRetro,
  FaUser,
  FaUserFriends,
} from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { isElectron, electronAPI } from "~/utils/electron";
import { useToggle } from "ahooks";
import { useNavigate, useLocation } from "react-router";
import {
} from "~/components/ui/tooltip";
import styles from "./TitleBar.module.css";
import { ModeToggle } from "./mode-toggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface TitleBarProps {
  title?: string;
}

export default function TitleBar({ }: TitleBarProps) {
  const api = electronAPI();
  const [isMaximized, { toggle: toggleMaximized }] = useToggle(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMinimize = () => {
    api?.minimizeWindow();
  };

  const handleMaximize = () => {
    if (isMaximized) {
      api?.unmaximizeWindow(); // Restore to previous size and position
    } else {
      api?.maximizeWindow();
    }
    toggleMaximized();
  };

  return (
    <div
      className={
        styles["appTitlebar"] +
        " flex flex-col bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      }
    >
      {/* Title bar with window controls */}

      {/* Navigation Bar */}
      <div className="flex items-center px-4 py-2">
        <div className="flex space-x-4">
          <Button
            size="sm"
            variant={location.pathname === "/" ? "outline" : "ghost"}
            onClick={() => {
              navigate("/");
            }}
          >
            <FaHome className="" />
          </Button>
          <Button
            onClick={() => {
              navigate("/social");
            }}
            size="sm"
            variant={location.pathname === "/social" ? "outline" : "ghost"}
          >
            <FaUserFriends />
          </Button>
          {/* <Button
            onClick={() => {
              navigate("/recognize");
            }}
            size="sm"
            variant={location.pathname === "/recognize" ? "outline" : "ghost"}
          >
            <FaCameraRetro className="" />
          </Button> */}
          <Button
            onClick={() => {
              navigate("/profile");
            }}
            size="sm"
            variant={location.pathname === "/profile" ? "outline" : "ghost"}
          >
            <FaUser className="" />
          </Button>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <div>
            <LanguageSwitcher />
          </div>
          <div>
            <ModeToggle />
          </div>
          <div>
            <div className="inline-flex items-center justify-between dark:bg-gray-800 select-none">
              {/* Window controls - only shown in Electron */}
              {isElectron() && (
                <div className="flex space-x-2 no-drag">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMinimize}
                    className="h-6 w-6 p-0 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <FaWindowMinimize className=" dark:text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaximize}
                    className="h-6 w-6 p-0 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {isMaximized ? (
                      <FaWindowMaximize className=" dark:text-gray-400 transform rotate-90" />
                    ) : (
                      <FaWindowMaximize className=" dark:text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMinimize}
                    className="h-6 w-6 p-0 flex items-center justify-center hover:bg-red-500 hover:text-white"
                  >
                    <FaTimes className=" dark:text-gray-400" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
