import { Moon, Sun } from "lucide-react"
import { Switch } from "~/components/ui/switch"
import { useTheme } from "~/components/theme-provider"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const isDark = theme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center space-x-2">
          <Sun className="h-4 w-4 text-foreground" />
          <Switch
            checked={isDark}
            onCheckedChange={toggleTheme}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
          />
          <Moon className="h-4 w-4 text-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDark ? "Dark mode" : "Light mode"}</p>
      </TooltipContent>
    </Tooltip>
  )
}