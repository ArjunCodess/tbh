"use client";

import Color from "color";
import { PipetteIcon } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerContextValue {
  hue: number;
  saturation: number;
  lightness: number;
  mode: string;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setMode: (mode: string) => void;
}
const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(
  undefined
);
export const useColorPicker = () => {
  const context = useContext(ColorPickerContext);
  if (!context) {
    throw new Error("useColorPicker must be used within a ColorPickerProvider");
  }
  return context;
};
export type ColorPickerProps = HTMLAttributes<HTMLDivElement> & {
  value?: Parameters<typeof Color>[0];
  defaultValue?: Parameters<typeof Color>[0];
  onChange?: (value: Parameters<typeof Color.rgb>[0]) => void;
};
export const ColorPicker = ({
  value,
  defaultValue = "#000000",
  onChange,
  className,
  children,
  ...props
}: ColorPickerProps) => {
  const base = useMemo(() => {
    try {
      return Color(value ?? defaultValue);
    } catch {
      try {
        return Color(String(defaultValue));
      } catch {
        return Color("#000000");
      }
    }
  }, [value, defaultValue]);
  const [hue, setHue] = useState(base.hue() || 0);
  const [saturation, setSaturation] = useState(base.saturationl() || 100);
  const [lightness, setLightness] = useState(base.lightness() || 50);
  const [mode, setMode] = useState("hex");
  const lastIncomingHexRef = useRef<string | null>(null);
  const skipNextEmitRef = useRef(false);
  useEffect(() => {
    const incoming = value ?? defaultValue;
    try {
      const c = Color(incoming).hsl();
      const arr = c.array();
      const nextH = Number(arr[0]) || 0;
      const nextS = Number(arr[1]) || 0;
      const nextL = Number(arr[2]) || 0;
      if (hue !== nextH) setHue(nextH);
      if (saturation !== nextS) setSaturation(nextS);
      if (lightness !== nextL) setLightness(nextL);
      lastIncomingHexRef.current = Color(incoming).hex().toLowerCase();
      skipNextEmitRef.current = true;
    } catch {
      // ignore invalid external values
    }
  }, [defaultValue]);

  useEffect(() => {
    if (!onChange) return;
    if (skipNextEmitRef.current) {
      skipNextEmitRef.current = false;
      return;
    }
    const color = Color.hsl(hue, saturation, lightness);
    const outgoingHex = color.hex().toLowerCase();
    if (lastIncomingHexRef.current === outgoingHex) return;
    const rgba = color.rgb().array();
    onChange([rgba[0], rgba[1], rgba[2]]);
    lastIncomingHexRef.current = outgoingHex;
  }, [hue, saturation, lightness, onChange]);
  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        lightness,
        mode,
        setHue,
        setSaturation,
        setLightness,
        setMode,
      }}
    >
      <div className={cn("flex size-full flex-col gap-4", className)} {...props}>
        {children}
      </div>
    </ColorPickerContext.Provider>
  );
};
export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>;
export const ColorPickerSelection = memo(
  ({ className, ...props }: ColorPickerSelectionProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { hue, saturation, lightness, setSaturation, setLightness } = useColorPicker();

    // calculate pointer position from saturation and lightness
    const getPointerPosition = useCallback(() => {
      // x: saturation (0-100) -> 0-1
      const x = Math.max(0, Math.min(1, saturation / 100));
      // y: lightness mapping
      // reverse the calculation in handlePointerMove
      // topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x)
      // lightness = topLightness * (1 - y)
      // so: y = 1 - (lightness / topLightness)
      const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x);
      const y = 1 - (lightness / topLightness);
      return {
        x,
        y: Math.max(0, Math.min(1, y)),
      };
    }, [lightness]);

    const pointer = getPointerPosition();

    const backgroundGradient = useMemo(() => {
      return `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0)),
            linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0)),
            hsl(${hue}, 100%, 50%)`;
    }, [hue]);
    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        if (!(isDragging && containerRef.current)) {
          return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(
          0,
          Math.min(1, (event.clientX - rect.left) / rect.width)
        );
        const y = Math.max(
          0,
          Math.min(1, (event.clientY - rect.top) / rect.height)
        );
        setSaturation(x * 100);
        const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x);
        const lightness = topLightness * (1 - y);
        setLightness(lightness);
      },
      [isDragging, setSaturation, setLightness]
    );
    useEffect(() => {
      const handlePointerUp = () => setIsDragging(false);
      if (isDragging) {
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      }
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }, [isDragging, handlePointerMove]);
    return (
      <div
        className={cn("relative size-full cursor-crosshair rounded", className)}
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          handlePointerMove(e.nativeEvent);
        }}
        ref={containerRef}
        style={{
          background: backgroundGradient,
        }}
        {...props}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white"
          style={{
            left: `${pointer.x * 100}%`,
            top: `${pointer.y * 100}%`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    );
  }
);
ColorPickerSelection.displayName = "ColorPickerSelection";
export type ColorPickerHueProps = ComponentProps<typeof Slider.Root>;
export const ColorPickerHue = ({
  className,
  ...props
}: ColorPickerHueProps) => {
  const { hue, setHue } = useColorPicker();
  return (
    <Slider.Root
      className={cn("relative flex h-4 w-full touch-none", className)}
      max={360}
      onValueChange={([hue]) => setHue(hue)}
      step={1}
      value={[hue]}
      {...props}
    >
      <Slider.Track className="relative my-0.5 h-3 w-full grow rounded-full bg-[linear-gradient(90deg,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)]">
        <Slider.Range className="absolute h-full" />
      </Slider.Track>
      <Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </Slider.Root>
  );
};
export type ColorPickerEyeDropperProps = ComponentProps<typeof Button>;
export const ColorPickerEyeDropper = ({
  className,
  ...props
}: ColorPickerEyeDropperProps) => {
  const { setHue, setSaturation, setLightness } = useColorPicker();
  const handleEyeDropper = async () => {
    if (!('EyeDropper' in window)) {
      console.warn('EyeDropper API is not supported in this browser');
      return;
    }
    try {
      // @ts-expect-error - EyeDropper API is experimental
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const color = Color(result.sRGBHex);
      const [h, s, l] = color.hsl().array();
      setHue(h);
      setSaturation(s);
      setLightness(l);
    } catch (error) {
      console.error("EyeDropper failed:", error);
    }
  };
  return (
    <Button
      className={cn("shrink-0 text-muted-foreground", className)}
      onClick={handleEyeDropper}
      size="icon"
      variant="outline"
      type="button"
      {...props}
    >
      <PipetteIcon size={16} />
    </Button>
  );
};

export type ColorPickerOutputProps = ComponentProps<typeof Input>;
export const ColorPickerOutput = ({ ...props }: ColorPickerOutputProps) => {
  const { hue, saturation, lightness, setHue, setSaturation, setLightness } = useColorPicker();
  const [inputValue, setInputValue] = useState(() => Color.hsl(hue, saturation, lightness).hex());

  useEffect(() => {
    setInputValue(Color.hsl(hue, saturation, lightness).hex());
  }, [hue, saturation, lightness]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    try {
      const color = Color(val);
      const hsl = color.hsl().array();
      setHue(Number(hsl[0]) || 0);
      setSaturation(Number(hsl[1]) || 0);
      setLightness(Number(hsl[2]) || 0);
    } catch {
      // ignore invalid input
    }
  };

  return (
    <Input
      className="h-8 w-full px-2 text-xs shadow-none"
      type="text"
      value={inputValue}
      onChange={handleChange}
      {...props}
    />
  );
};