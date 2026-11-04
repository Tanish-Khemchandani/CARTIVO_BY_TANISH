// Extended "About this product" copy, keyed by product slug.
// Shared by seed/seed.js (so a reseed keeps the copy) and by
// scripts/updateProductDescriptions.js (backfill for an existing catalog).
// Each value is the full description: paragraphs are separated by a blank
// line, because the product page splits on /\n{2,}/.
const descriptions = {
  "solid-oak-minimalist-side-table": [
    "A compact solid-oak side table with a clean rectangular top, rounded edges, and tapered legs.",
    "The top is cut from solid oak and finished with a low-sheen coat that lets the natural grain show through, while the rounded corners keep it safe beside a sofa or a bed. The tapered legs screw into pre-fitted brackets, so assembly takes a couple of minutes and needs no tools.",
    "Wipe with a dry or barely damp cloth and dry spills straight away, because standing water marks solid oak over time. Keep it out of prolonged direct sun so the tone stays even across the top.",
  ].join("\n\n"),

  "botanical-hydration-skincare-gift-set": [
    "A coordinated botanical skincare set with a hydrating serum, cream, and facial mist.",
    "The three steps are meant to layer: the serum goes on first, the cream seals that moisture in, and the mist refreshes through the day. Everything arrives in a gift-ready box with a printed card explaining the order of use.",
    "Patch test on a small area before first use, then work from the lightest texture to the heaviest on clean skin. Store away from direct sunlight and close the caps fully between uses.",
  ].join("\n\n"),

  "cartivo-fresh-organic-indian-spice-box-set-of-6": [
    "Six glass spice jars in a bamboo case, with turmeric, chili, cumin, coriander, mustard, and cardamom.",
    "The airtight glass jars keep each spice separate and labelled, and the bamboo case holds them upright so you can see at a glance what needs refilling. The set is sized to sit on a shelf or inside a cabinet without taking over the counter.",
    "Refill from your regular packs and keep the case away from the hob and steam so the aromas stay strong. Glass and bamboo are hand-washable; dry the jars completely before refilling.",
  ].join("\n\n"),

  "compact-15l-electric-kettle-matte-white": [
    "A compact 1.5-liter electric kettle with a matte-white body, stainless-steel base, and water-level window.",
    "The 1.5-litre capacity fills about six cups at once, and the water-level window on the side lets you boil only what you need. It sits on a 360-degree cordless base, so lifting it to pour is effortless from any angle.",
    "Automatic cut-off switches the kettle off when the water boils or it runs dry. Descale every few weeks with a rinse of equal parts water and vinegar to keep the element fast.",
  ].join("\n\n"),

  "studio-wireless-noise-cancelling-headphones-midnight-black": [
    "Over-ear wireless headphones with padded cups, an adjustable headband, and active-noise-cancelling styling.",
    "The padded cups seal around the ears and the headband adjusts to fit, so long listening sessions stay comfortable. Bluetooth pairs with two devices at once, and the box includes a USB-C charging cable plus a 3.5 mm cable for flights and wired listening.",
    "Charge fully before first use, because a short top-up already gives hours of playback. Wipe the cushions with a soft cloth and keep them out of direct sun so the padding does not dry out.",
  ].join("\n\n"),

  "everyday-organic-cotton-canvas-tote-bag-natural": [
    "A reusable natural cotton-canvas tote with sturdy shoulder straps and a clean, unprinted finish.",
    "The canvas is thick enough to carry a laptop, a water bottle and a day's shopping without losing shape, and the long straps sit comfortably even when the bag is full. The unprinted front is deliberate: it goes with everything and never dates.",
    "Machine wash cold on a gentle cycle and line dry to keep the canvas crisp. Empty the pockets and shake out crumbs before washing so the weave stays clean.",
  ].join("\n\n"),

  "cartivo-neo-5g-smartphone-graphite-256gb": [
    "A graphite 5G smartphone with a high-resolution display, multi-camera system, and 256GB storage.",
    "256GB leaves room for years of photos, apps and downloads without a storage warning. The multi-camera system covers wide, ultra-wide and portrait framing, and both SIM slots support 5G.",
    "The setup wizard moves your contacts, photos and apps across from your old phone in a few minutes. Fit a case and screen protector early, because the graphite finish shows fingerprints and desk scuffs quickly.",
  ].join("\n\n"),

  "organic-himalayan-premium-basmati-rice-5kg": [
    "Aged long-grain aromatic basmati rice straight from Himalayan foothills.",
    "Each grain stays long and separate after cooking, with the nutty aroma basmati is known for. The 5kg pack is resealable, so the rice stays fresh between meals instead of sitting open in the cupboard.",
    "Rinse until the water runs clear, soak for 20 minutes, then cook with twice the volume of water for fluffy, non-sticky rice. Store in a cool, dry place away from moisture and strong odours.",
  ].join("\n\n"),

  "cast-iron-dutch-oven-non-stick-skillet-set": [
    "Pre-seasoned multi-ply stainless steel and enameled cast iron cookware set.",
    "The set covers the everyday jobs: a heavy Dutch oven for slow curries, stews and one-pot bread, and a non-stick skillet for breakfasts and quick stir-fries. Multi-ply steel spreads heat evenly, so food does not catch at the edges.",
    "Season before the first use and hand-wash with warm water, and avoid metal tools on the non-stick surface. A light wipe of oil after drying keeps both pieces ready for the next cook.",
  ].join("\n\n"),

  "contemporary-abstract-canvas-wall-art-set-of-2": [
    "Framed modern gallery-wrapped museum canvas art in rich navy and gold accents.",
    "Both canvases arrive gallery-wrapped on solid frames with the fixing kit included, so they are ready to hang out of the box. The navy and gold palette matches across the pair, so the two pieces read as one composition.",
    "Hang them with a 10 to 15 cm gap between frames, away from direct afternoon sun, and dust with a dry cloth. Do not use water or glass cleaner on the printed surface.",
  ].join("\n\n"),

  "pure-egyptian-cotton-400tc-queen-fitted-bedsheet-set": [
    "Ultra-soft sateen weave breathable pure combed cotton bedsheet with two pillowcases.",
    "The fitted sheet has deep elastic corners that grip a queen mattress, and the set includes two standard pillowcases. The 400-thread-count sateen weave feels cool in summer and warm in winter, and it softens further with every wash.",
    "Machine wash warm on a gentle cycle with like colours and tumble dry low, and skip fabric softener so the weave stays crisp. Iron on low while slightly damp if you prefer a smooth finish.",
  ].join("\n\n"),

  "nordic-minimalist-brass-arch-floor-lamp": [
    "Warm LED dimmable floor lamp with satin brass finish and heavy marble base.",
    "The arch reaches over a sofa or a reading chair without needing a wall fix, and the marble base keeps it steady. The warm LED bulb dims from full task light down to a low evening glow.",
    "Wipe the brass with a dry cloth to keep the satin finish bright. The bulb is replaceable and rated for long use, so switch the lamp off and let it cool before changing it.",
  ].join("\n\n"),

  "handcrafted-ceramic-vase-dried-floral-arrangement": [
    "Minimalist Scandinavian matte glazed ceramic vase with pampas grass bouquet.",
    "The vase is thrown and glazed by hand, so the matte surface has slight variation that makes each piece individual. The dried pampas and grasses arrive ready to arrange and hold their shape for months without water.",
    "Trim the stems to the height you want before arranging them, and keep the vase out of direct sun so the dried stems do not fade. A light shake outdoors keeps the plumes full.",
  ].join("\n\n"),

  "luxury-dead-sea-mineral-body-wash-scrub-set": [
    "Infused with therapeutic essential oils, sea salt, and aloe vera.",
    "The set pairs a mineral body wash with a matching salt scrub, so cleansing and exfoliating happen in the same shower. Sea salt and aloe vera leave skin soft rather than tight, and the essential-oil blend gives a light, clean scent.",
    "Use the scrub two or three times a week on damp skin, then follow with the wash. Rinse well and keep the caps closed so the salts stay dry between uses.",
  ].join("\n\n"),

  "eco-friendly-plant-based-home-cleaning-care-kit": [
    "Non-toxic, biodegradable surface cleaner, laundry wash and dish wash kit.",
    "Three plant-based formulas cover the jobs you do most: a surface spray, a laundry wash and a dish wash, in bottles made to be refilled rather than thrown away. They are biodegradable and free from harsh bleach fumes.",
    "Patch test on an inconspicuous spot before using on stone or sealed wood, and keep the bottles out of reach of children. The dosing caps are marked for a full load, so a little goes a long way.",
  ].join("\n\n"),

  "farm-fresh-organic-hass-avocados-fruit-box": [
    "Handpicked premium organic seasonal fruits packed hygienically.",
    "The box is packed the day it ships, with the firmer avocados placed so they ripen over a couple of days instead of all arriving soft at once. Everything sits in a vented tray that keeps bruising to a minimum.",
    "Keep avocados at room temperature until they give slightly to a pinch, then move them to the fridge to hold them. Chill the rest of the fruit and eat within the window printed on the box.",
  ].join("\n\n"),

  "bosch-8-kg-5-star-front-load-washing-machine": [
    "EcoSilence Drive, Anti-Stain technology, and hygienic Steam Wash with ActiveWater Plus.",
    "The 8 kg drum takes a full family load in one go, and the 5-star rating keeps running costs low. EcoSilence Drive runs quietly enough for a late-night wash, while Steam Wash loosens stubborn stains without pre-soaking.",
    "Leave the door ajar between cycles so the drum dries out, and run the self-clean programme once a month. Installation includes inlet and drain setup, so keep the manual with your warranty card.",
  ].join("\n\n"),

  "samsung-324l-double-door-frost-free-refrigerator": [
    "Twin Cooling Plus technology with 5 conversion modes and digital inverter compressor.",
    "At 324 litres the fridge suits a family of four, and the convertible freezer switches between freezer and fridge modes when you need more chilled space. Twin Cooling Plus keeps the two compartments at separate humidity levels, so vegetables do not dry out.",
    "Level the unit with the adjustable feet so the door seals fully, and leave a few centimetres of clearance at the back for airflow. Wipe the door seals monthly to keep them flexible.",
  ].join("\n\n"),

  "sony-bravia-55-inch-4k-ultra-hd-smart-google-tv": [
    "X1 4K HDR Processor, Triluminos Pro display, Dolby Vision and Dolby Atmos sound.",
    "The 55-inch 4K panel upscales everyday content with the X1 processor, while Dolby Vision and Dolby Atmos make films feel like a small theatre. Google TV gathers your streaming apps, recommendations and voice search in one place.",
    "Use the included stand or mount it on a compatible bracket, and leave space around the vents for airflow. Connect a soundbar over HDMI ARC if you want dialogue even clearer.",
  ].join("\n\n"),

  "sony-playstation-5-console-dualsense-controller": [
    "Lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback.",
    "The ultra-high-speed SSD cuts load times to seconds, and the DualSense controller adds haptic feedback and adaptive triggers that change feel between driving, shooting and climbing. The console outputs 4K on compatible displays.",
    "Stand the console upright with clear space around the vents, update the system software on first boot, and pair the controller over USB for the initial setup. Dust the vents occasionally so it stays quiet.",
  ].join("\n\n"),

  "sandisk-extreme-1tb-portable-external-ssd-1050mb-s": [
    "Fast NVMe solid state performance featuring 1050MB/s read and 1000MB/s write speeds, IP55 rated.",
    "Reads up to 1050MB/s and writes up to 1000MB/s, so a full film library or a project backup moves in minutes rather than hours. The IP55 rating shrugs off dust and a splash of water, and the rubberised body survives a drop from desk height.",
    "It is bus-powered from the USB-C port, so nothing beyond the cable in the box is needed. Keep it in its sleeve when not in use and eject it safely before unplugging.",
  ].join("\n\n"),

  "anker-powercore-20000mah-30w-fast-charging-power-bank": [
    "Massive 20,000mAh capacity delivers multiple charges with PowerIQ 3.0 high-speed USB-C output.",
    "20,000mAh holds several full phone charges, and the 30W USB-C output can top up a tablet in a pinch. PowerIQ 3.0 reads what is plugged in and delivers the fastest safe rate for that device.",
    "Charge it overnight before a trip and check the LED indicators to see how much is left. Power banks travel in cabin luggage only, because they are not allowed in checked bags.",
  ].join("\n\n"),

  "samsung-galaxy-s24-ultra-5g-titanium-black-256gb": [
    "Galaxy AI is here. Epic 200MP camera, built-in S Pen, and Snapdragon 8 Gen 3 for Galaxy.",
    "The S Pen slides into the body for notes, sketches and photo edits, while the 200MP main camera crops in without losing detail. Snapdragon 8 Gen 3 for Galaxy keeps games and multitasking smooth.",
    "Set up Galaxy AI from the welcome screen, and fit a case early because the titanium frame is tough but shows scuffs at the corners. Charge with a 45W adapter for the fastest top-up (sold separately).",
  ].join("\n\n"),

  "playful-comfort-pure-cotton-kids-summer-set": [
    "100% breathable organic combed cotton with non-fade eco dyes.",
    "The set is cut for movement, with soft seams and a roomy fit so nothing scratches or restricts play. Combed cotton is smooth against skin, which matters for children who react to scratchy fabric.",
    "Machine wash cold with similar colours and tumble dry low, because the eco dyes are chosen to stay fast. Size up if you want room to grow through the season.",
  ].join("\n\n"),

  "aura-structured-italian-leather-crossbody-bag": [
    "Handcrafted pebble-grain leather with gold-tone hardware and adjustable strap.",
    "Structured enough to hold its shape when it is set down, with a main compartment, a slip pocket for a phone and a zipped pocket for cards. The gold-tone hardware and pebble-grain finish dress it up or down.",
    "Wipe with a soft dry cloth and store in the dust bag it arrives in. Keep it out of wet weather, because leather spots if it soaks and should be dried naturally if it does.",
  ].join("\n\n"),

  "urban-classic-men-s-quilted-bomber-jacket": [
    "Premium windproof cotton-twill blend, ribbed cuffs and collar with interior secure pockets.",
    "The quilted lining adds warmth without bulk, and the windproof twill shell cuts the chill on a commute. Ribbed cuffs and collar hold their shape, and the interior pockets keep a phone and wallet secure.",
    "Machine wash cold on a gentle cycle and hang to dry so the quilting keeps its loft. Store on a wide hanger to keep the shoulders flat.",
  ].join("\n\n"),

  "oneplus-12-5g-flowy-emerald-16gb-ram-512gb": [
    "Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera, and 5400mAh battery with 100W SUPERVOOC charging.",
    "The 5400mAh battery with 100W SUPERVOOC charging refills in well under an hour, and the Hasselblad-tuned cameras handle skin tones and night shots without over-processing.",
    "This variant carries 16GB of RAM with 512GB of storage, so large games and long video clips fit without juggling files. Add a case on day one, because the Flowy Emerald finish is glossy and shows fingerprints.",
  ].join("\n\n"),

  "vivo-x100-pro-5g-asteroid-black-512gb": [
    "Co-engineered with ZEISS. 1-inch Sony IMX989 sensor and Dimensity 9300 flagship chip.",
    "The 1-inch Sony sensor gathers more light for night portraits, and the ZEISS coatings keep flare down when you shoot into the sun. The Dimensity 9300 chip handles heavy games and photo editing without dropping frames.",
    "The ZEISS colour modes sit inside the camera app, so try them in daylight first to see the difference. Keep the firmware updated, because camera tuning improves after launch.",
  ].join("\n\n"),

  "xiaomi-14-ultra-titanium-white-512gb": [
    "Leica Quad Camera with variable aperture, Snapdragon 8 Gen 3, and stunning micro-curved display.",
    "The variable aperture lets you choose how much of a scene stays sharp, and the Leica tuning offers both a vivid and a classic look from the same lens. The micro-curved display keeps edge swipes comfortable.",
    "Both Leica looks are selectable in the camera app, so it is worth trying them side by side. The 512GB variant suits heavy video capture; back up over Wi-Fi to keep the storage free.",
  ].join("\n\n"),

  "apple-iphone-15-pro-128gb-natural-titanium": [
    "Forged in titanium with the industry-leading A17 Pro chip, customisable Action button and 48MP main camera.",
    "The Action button replaces the old mute switch with a shortcut you choose: camera, voice memo, focus mode or anything else. Titanium makes the frame lighter than steel while staying rigid, and the 48MP main camera crops to three focal lengths.",
    "Set the Action button during first-run setup and pair a MagSafe case for cable-free charging. 128GB suits everyday use, and photo optimisation keeps the storage tidy.",
  ].join("\n\n"),

  "realme-gt-6-5g-fluid-silver-256gb": [
    "Flagship killer with Snapdragon 8s Gen 3, 6000-nit ultra-bright display, and Sony 50MP OIS camera.",
    "The 6000-nit panel stays readable in direct sunlight, and the Sony 50MP main camera with optical stabilisation keeps low-light shots sharp instead of smeared. Snapdragon 8s Gen 3 runs current titles at high settings with room to spare.",
    "This variant carries 256GB of storage for apps, photos and downloads. Update the camera app on first setup for the latest tuning, and add a case because the Fluid Silver back is smooth.",
  ].join("\n\n"),
};

module.exports = descriptions;
