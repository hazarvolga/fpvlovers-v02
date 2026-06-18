export interface ProductReference {
  id: string; // unique identifier
  name: string; // e.g., "DJI O4 Pro"
  brand: string; // e.g., "DJI"
  category: string; // e.g., "goggles", "radio", "whoop"
  specs?: Record<string, string | number>; // key-value specifications
  pricePlaceholder?: string; // approximate price or price range indicator, e.g. "$$$", "$300-$350"
  imageUrl?: string;
}
