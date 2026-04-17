import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OLD_PROJECT_URL = "https://lxmzswwvpiuwfetqpbeu.supabase.co";

const FESTIVAL_FILES = [
  "ice-snow-festival-harbin.png",
  "jaipur-literature-festival.png",
  "Sinulog Festival.jpg",
  "timkat.jpeg",
  "Up Helly Aa.jpg",
  "Pongal.jpg",
  "kite festival.jpg",
  "Ati-Atihan Festival.jpg",
  "venice-carnival.jpg",
  "Rio Carnival.jpg",
  "Lantern Festival.jpg",
  "Ivrea Orange Festival.jpg",
  "Sapporo Snow Festival.jpg",
  "Quebec Winter Carnival.jpg",
  "Carnival of Oruro.jpg",
  "Carnaval de Barranquilla.jpg",
  "Tapati Rapa Nui.jpg",
  "holi-india.png",
  "St Patrick's Day.jpg",
  "Nowruz.jpg",
  "Cape Town Jazz Festival.jpg",
  "Nyepi.jpg",
  "Songkran-Festival-with-Aleenta-Phuket.jpg",
  "Tulip Keukenhof.jpg",
  "Feria de Abril.jpg",
  "Paro-Tshechu-Festival-Tour.jpg",
  "Anzac Day Dawn Service.jpg",
  "Cannes Film Festival.jpg",
  "Chelsea Flower Show.jpg",
  "Vesak Day.jpg",
  "Monaco Grand Prix.jpeg",
  "Rocket Festival.jpg",
  "Waisak at Borobudur.jpg",
  "Inti-Raymi-in-Cusco.jpg",
  "midsommar festival.jpg",
  "Dragon-Boat-Festival.jpg",
  "Festa de Sao Joao.jpg",
  "White Nights Festival.jpg",
  "Hemis Festival.jpg",
  "Bastille Day.jpg",
  "Calgary Stampede.jpg",
  "Naadam Festival.jpg",
  "Tomorrowland.jpg",
  "Festa del Redentore.jpg",
  "Phi Ta Khon.jpg",
  "Obon Festival.jpg",
  "Il Palio.jpg",
  "La Tomatina.jpg",
  "Edinburgh Fringe Festival.jpg",
  "Notting Hill Carnival.jpg",
  "Burning Man.jpg",
  "Ganesh Chaturthi.jpg",
  "festa_gracia_gracia_festival_barcelona.jpg",
  "Venice Film Festival.jpg",
  "Onam.jpg",
  "Gerewol-Festival.jpg",
  "Mid-Autumn Moon Festival.jpg",
  "La Merce.jpg",
  "Festival of San Gennaro.jpg",
  "Mud_Fest_2008_(2679028799).jpg",
  "halloween-salem.jpg",
  "Garba-Ahmedabad.png",
  "The-Dance-of-Dhunuchi.jpg",
  "Day of the Dead.jpg",
  "Loi Krathong.jpg",
  "guy-fawkes-lewes.jpg",
  "surin-elephant-roundup.jpg",
  "beaujolais-nouveau-beaune.jpg",
  "Christmas Markets.jpg",
  "new-years-eve-sydney.jpg",
  "Krampusnacht.jpeg",
  "Hogmanay.jpg",
  "Las Posadas.jpg",
  "Winter Solstice at Stonehenge.jpg",
  "Coachella.jpg",
  "Kings-day.jpg",
  "Norway.jpeg",
  "Melon Day.jpeg",
];

const Q1_CATEGORY_FILES = [
  "culture-history.jpg",
  "nature-outdoors.jpg",
  "beach-coastal.jpg",
  "food-culinary.jpg",
  "arts-music-nightlife.jpg",
  "active-sport.jpg",
  "shopping-markets.jpg",
  "wellness-slow-travel.jpg",
];

function contentTypeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpeg" || ext === "jpg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: { file: string; bucket: string; status: string; error?: string }[] = [];

  // Ensure the festivals bucket exists in the new project
  const { error: bucketErr } = await supabase.storage.createBucket("festivals", { public: true });
  if (bucketErr && !bucketErr.message.includes("already exists")) {
    return new Response(
      JSON.stringify({ error: `Could not create festivals bucket: ${bucketErr.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Migrate festival images
  for (const filename of FESTIVAL_FILES) {
    const encodedName = encodeURIComponent(filename);
    // Old project uses double-slash for root-level files
    const oldUrl = `${OLD_PROJECT_URL}/storage/v1/object/public/festivals//${encodedName}`;

    try {
      const resp = await fetch(oldUrl);
      if (!resp.ok) {
        results.push({ file: filename, bucket: "festivals", status: "fetch_failed", error: `HTTP ${resp.status}` });
        continue;
      }
      const body = await resp.arrayBuffer();
      const { error: uploadErr } = await supabase.storage
        .from("festivals")
        .upload(filename, body, {
          contentType: contentTypeFor(filename),
          upsert: true,
        });
      if (uploadErr) {
        results.push({ file: filename, bucket: "festivals", status: "upload_failed", error: uploadErr.message });
      } else {
        results.push({ file: filename, bucket: "festivals", status: "ok" });
      }
    } catch (e) {
      results.push({ file: filename, bucket: "festivals", status: "error", error: String(e) });
    }
  }

  // Migrate q1-category images
  for (const filename of Q1_CATEGORY_FILES) {
    const storagePath = `q1-categories/${filename}`;
    const oldUrl = `${OLD_PROJECT_URL}/storage/v1/object/public/travel-images/${storagePath}`;

    try {
      const resp = await fetch(oldUrl);
      if (!resp.ok) {
        results.push({ file: storagePath, bucket: "travel-images", status: "fetch_failed", error: `HTTP ${resp.status}` });
        continue;
      }
      const body = await resp.arrayBuffer();
      const { error: uploadErr } = await supabase.storage
        .from("travel-images")
        .upload(storagePath, body, {
          contentType: contentTypeFor(filename),
          upsert: true,
        });
      if (uploadErr) {
        results.push({ file: storagePath, bucket: "travel-images", status: "upload_failed", error: uploadErr.message });
      } else {
        results.push({ file: storagePath, bucket: "travel-images", status: "ok" });
      }
    } catch (e) {
      results.push({ file: storagePath, bucket: "travel-images", status: "error", error: String(e) });
    }
  }

  const succeeded = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status !== "ok");

  return new Response(
    JSON.stringify({ total: results.length, succeeded, failed_count: failed.length, failures: failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
