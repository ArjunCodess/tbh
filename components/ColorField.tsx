import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/components/ui/color-picker";

export default function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (hex: string) => void;
}) {
  if (!value) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-2 text-sm font-medium">{label}</div>
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <ColorPicker
        className="flex w-full flex-col gap-3"
        value={value}
        onChange={(rgba) => {
          const [r, g, b] = rgba as any;
          const hex = `#${[r, g, b]
            .map((n: number) =>
              Math.max(0, Math.min(255, Math.round(n)))
                .toString(16)
                .padStart(2, "0")
            )
            .join("")}`;
          onChange(hex.toUpperCase());
        }}
      >
        <ColorPickerSelection className="h-24 rounded-md" />
        <div className="flex items-center gap-4">
          <ColorPickerEyeDropper />
          <div className="grid w-full gap-1">
            <ColorPickerHue />
            <ColorPickerOutput />
          </div>
        </div>
      </ColorPicker>
    </div>
  );
}