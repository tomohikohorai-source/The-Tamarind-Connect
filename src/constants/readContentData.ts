
export interface ReadData {
  novels: {
    chapter: number;
    title: string;
    content: string;
    snippet: string;
  }[];
  columns: {
    id: number;
    title: string;
    content: string;
    snippet: string;
  }[];
}

export const PRE_CREATED_CONTENT: ReadData = {
  novels: [
    {
      chapter: 1,
      title: "Chapter 1: The Arrival",
      content: "Sarah stood on the balcony of her new apartment, the humid air of **Penang** wrapping around her like a warm blanket. Below, the lights of Gurney Drive were just beginning to flicker on. She had moved here for a fresh start, leaving behind the cold winters of London for the tropical allure of the Pearl of the Orient.\n\n\"Nice view, isn't it?\" a voice rasped from the neighboring balcony. Sarah turned to see an elderly man with a kind face and sharp eyes. \"I'm **Mr. Tan**. I've lived in this building since it was built. You're in 12B, the old Lim apartment.\"\n\nSarah smiled. \"I'm Sarah. It's beautiful here.\"\n\nMr. Tan nodded slowly. \"Beautiful, yes. But this building has its secrets, Sarah. Keep your eyes open.\"",
      snippet: "Sarah moves into her new Penang condo and meets her mysterious neighbor, Mr. Tan."
    },
    {
      chapter: 2,
      title: "Chapter 2: The Hidden Map",
      content: "The first week in the condo was spent unpacking boxes. While cleaning the kitchen cabinets, Sarah noticed a loose tile near the floor. Curiosity got the better of her, and she gently pried it open. Behind it lay a small, dusty bundle wrapped in oilcloth.\n\nInside was an old, hand-drawn map of **George Town**. It wasn't a standard tourist map; it was filled with strange symbols and handwritten notes in a language she didn't recognize. One particular spot near the **Clan Jetties** was circled in red ink.\n\nSarah felt a thrill of excitement. Why would someone hide a map in a kitchen cabinet? She decided to show it to Mr. Tan the next time she saw him.",
      snippet: "Sarah discovers a mysterious hand-drawn map hidden behind a loose tile in her kitchen."
    },
    {
      chapter: 3,
      title: "Chapter 3: The First Clue",
      content: "Mr. Tan's eyes widened when Sarah showed him the map. \"This... this belonged to **Old Man Lim**. He was a historian, always obsessed with the lost treasures of the Straits Settlements. He disappeared ten years ago, and his family sold the place shortly after.\"\n\nHe pointed to the red circle. \"This is near the **Chew Jetty**. There's an old coffee shop there, 'The Silver Anchor'. It's been closed for years, but the building still stands.\"\n\nSarah decided to visit the jetty the next morning. As she walked along the wooden planks, the smell of salt and dried fish filled the air. She found the Silver Anchor, its windows boarded up and covered in grime. But on the door frame, she saw a symbol that matched one on her map.",
      snippet: "Mr. Tan identifies the map as belonging to a missing historian, leading Sarah to an abandoned coffee shop."
    },
    {
      chapter: 4,
      title: "Chapter 4: The Mysterious Stall",
      content: "As Sarah examined the symbol on the door, a young woman approached her. \"Looking for something?\" she asked, her voice friendly but cautious. Her name was **Mei**, and she ran a small laksa stall nearby.\n\nSarah showed her the map. Mei's expression changed from curiosity to shock. \"My grandfather used to talk about this map. He was a close friend of Mr. Lim. They used to spend hours at the Silver Anchor, talking about the 'Penang Pearl'.\"\n\nMei led Sarah to her stall. \"The map isn't just about locations, Sarah. It's about stories. My grandfather left me something that might help, but I never knew what it was for until now.\"",
      snippet: "Sarah meets Mei, whose grandfather was a friend of the map's creator, and learns about the 'Penang Pearl'."
    },
    {
      chapter: 5,
      title: "Chapter 5: The Secret Compartment",
      content: "Mei reached under her counter and pulled out an old, chipped **laksa bowl**. It looked ordinary, but when she pressed a specific pattern on the painted dragons, the bottom of the bowl clicked and slid open.\n\nInside was a small brass key and a folded piece of parchment. \"My grandfather told me to keep this safe until someone came with the map,\" Mei whispered. \"He said the Silver Anchor was just the beginning.\"\n\nSarah and Mei returned to the abandoned coffee shop. Using the brass key, they managed to unlock a small side door. Inside, the air was thick with dust and the faint scent of old coffee beans. In the center of the room stood a large, ornate wooden desk.",
      snippet: "Mei reveals a secret compartment in an old bowl containing a key that unlocks the abandoned coffee shop."
    },
    {
      chapter: 6,
      title: "Chapter 6: The Letter",
      content: "The desk was locked, but the brass key fit perfectly. Inside the top drawer, they found a single envelope addressed to 'The One Who Follows'. Sarah opened it with trembling hands.\n\n*\"If you are reading this, then the map has found its way to you. The Penang Pearl is not a gem of stone, but a legacy of the heart. It lies where the mountain meets the sea, within the walls that hold the memories of the Lim family.\"*\n\n\"The walls that hold the memories...\" Sarah mused. \"That must mean the apartment! My condo!\" Mei nodded. \"But where? We've searched the whole place.\"\n\nSarah remembered the basement storage unit she hadn't visited yet. Maybe the answer was there.",
      snippet: "A letter found in the desk suggests that the 'Penang Pearl' is hidden within the walls of Sarah's own apartment building."
    },
    {
      chapter: 7,
      title: "Chapter 7: The Family Secret",
      content: "Back at the condo, Sarah and Mei met Mr. Tan in the lobby. When they told him about the letter, his face grew pale. \"The Lim family... they weren't just historians. They were the original developers of this land. Before this condo was built, there was a grand mansion here.\"\n\nHe led them to the basement. \"When they demolished the mansion, they kept the foundation. Some say they built the condo's storage units directly into the old wine cellars.\"\n\nThey found Sarah's unit, #12B-S. It was a small, dark room filled with the previous owner's junk. But as Sarah moved a heavy trunk, she noticed the floor sounded hollow. Underneath the concrete was a wooden trapdoor.",
      snippet: "Mr. Tan reveals the building's history, leading Sarah and Mei to a hidden trapdoor in the basement storage."
    },
    {
      chapter: 8,
      title: "Chapter 8: The Midnight Search",
      content: "It was nearly midnight when they finally managed to pry open the trapdoor. Below was a narrow stone staircase leading into the darkness. With only their phone flashlights to guide them, they descended into the cool, damp air of the old cellar.\n\nThe walls were lined with empty wine racks, but at the far end was a solid brick wall that looked newer than the rest. Sarah noticed a small indentation in the bricks, shaped exactly like the pendant Mr. Tan wore around his neck.\n\n\"Mr. Tan?\" Sarah asked. The old man hesitated, then reached for his necklace. \"I promised Old Man Lim I would only use this if the right person came along. I think that's you, Sarah.\"",
      snippet: "Sarah, Mei, and Mr. Tan descend into a hidden cellar where a secret wall awaits a special key."
    },
    {
      chapter: 9,
      title: "Chapter 9: The Hidden Room",
      content: "Mr. Tan pressed his pendant into the wall. With a low rumble, the bricks shifted and slid aside, revealing a small, circular room. The walls were covered in beautiful murals depicting the history of Penang—from the early trading days to the modern era.\n\nIn the center of the room was a stone pedestal, and on it sat a small, intricately carved wooden box. \"This is it,\" Mei whispered. \"The legacy of the Lim family.\"\n\nAs Sarah reached for the box, she felt a sense of responsibility. This wasn't just a treasure hunt anymore; it was about preserving a piece of history that had almost been forgotten.",
      snippet: "A secret room filled with historical murals is revealed, containing a mysterious wooden box."
    },
    {
      chapter: 10,
      title: "Chapter 10: The Locked Chest",
      content: "The wooden box was locked with a complex puzzle mechanism. It required sliding small tiles into the correct positions to form a picture of a **hibiscus**, the national flower of Malaysia.\n\nSarah, Mei, and Mr. Tan worked together, using the clues from the map and the letter. After an hour of careful movement, the final tile clicked into place. The lid of the box popped open with a soft sigh.\n\nInside was a collection of old photographs, a stack of letters tied with a silk ribbon, and a small, velvet-lined pouch. Sarah picked up the pouch. It felt heavy and cold. She slowly opened the drawstring.",
      snippet: "The team solves a puzzle to open the wooden box, discovering old photos, letters, and a mysterious pouch."
    },
    {
      chapter: 11,
      title: "Chapter 11: The Key",
      content: "Inside the pouch wasn't a pearl, but a beautifully crafted silver key with a head shaped like a lotus flower. Beneath it was a final note from Old Man Lim: *\"The key opens the heart of the Pearl. Look to the highest point where the sun first touches the building.\"*\n\n\"The rooftop!\" Sarah exclaimed. The condo had a private rooftop garden that was usually locked for maintenance. They rushed back upstairs, the excitement fueling their tired legs.\n\nAt the very top of the building, near the old water tank, they found a small, inconspicuous metal door. The lotus key fit perfectly. As the door swung open, they were greeted by the first rays of the morning sun.",
      snippet: "Instead of a pearl, they find a silver key that leads them to a secret door on the condo's rooftop."
    },
    {
      chapter: 12,
      title: "Chapter 12: The Revelation",
      content: "The door led to a small, glass-walled room that Sarah had never noticed from the ground. It was a private observatory, filled with old telescopes and astronomical charts. But the real treasure was in the center of the room.\n\nA large, glowing orb sat on a brass stand. It wasn't a gem, but a masterpiece of glasswork and light, designed to capture the reflection of the moon over the sea. \"The Penang Pearl,\" Mr. Tan whispered. \"It's a lighthouse of sorts, a symbol of guidance for those who are lost.\"\n\nBut as they admired the orb, Sarah noticed a small compartment at its base. Inside was a real pearl necklace, shimmering with an ethereal glow.",
      snippet: "They discover a secret rooftop observatory containing a magnificent glass orb and a real pearl necklace."
    },
    {
      chapter: 13,
      title: "Chapter 13: The True Value",
      content: "The letters in the box explained everything. The necklace was a gift from the original Sultan to the Lim family for their service to the community. It was a symbol of the bond between the people of Penang and those who helped build its future.\n\n\"This necklace is worth a fortune,\" Mei said, her eyes wide. \"But the letters... they say it belongs to the people of Penang, to be used for the benefit of the community if the family ever disappeared.\"\n\nSarah looked at the necklace, then at her friends. \"We can't just keep this. We need to honor Old Man Lim's wishes. But how do we find the rightful heir?\"",
      snippet: "The necklace is revealed to be a royal gift intended for the community, and Sarah decides to find the rightful heir."
    },
    {
      chapter: 14,
      title: "Chapter 14: The Decision",
      content: "After days of research and help from a local lawyer, they discovered that Mei was actually a distant relative of the Lim family. Her grandfather had been the 'black sheep' who left the family business to start his own life, but he had always kept the secret of the Pearl.\n\n\"Mei, it's yours,\" Sarah said, handing her the necklace. Mei shook her head. \"No, Sarah. It belongs to the community. I want to use it to start a foundation for preserving the heritage of George Town.\"\n\nMr. Tan smiled. \"Old Man Lim would be proud. The Pearl has finally found its way home.\"",
      snippet: "Mei is discovered to be the heir, and she decides to use the treasure to start a heritage preservation foundation."
    },
    {
      chapter: 15,
      title: "Chapter 15: The Legacy",
      content: "A month later, the **Penang Pearl Foundation** was officially launched. The rooftop observatory was opened to the public as a small museum, and the glass orb once again glowed every night, a beacon of hope over Gurney Drive.\n\nSarah sat on her balcony, sharing a cup of coffee with Mr. Tan and Mei. She had come to Penang looking for a fresh start, but she had found something much more valuable: a family and a sense of belonging.\n\nAs the sun set over the Andaman Sea, Sarah knew she was exactly where she was meant to be. The shadows of Gurney Drive were no longer mysterious; they were home.",
      snippet: "The story concludes with the launch of a heritage foundation and Sarah finding a true home in Penang."
    }
  ],
  columns: [
    {
      id: 1,
      title: "The King of Street Food: Char Kway Teow",
      content: "No trip to **Penang** is complete without a plate of **Char Kway Teow**. This iconic dish consists of flat rice noodles stir-fried over intense heat (known as 'wok hei') with prawns, cockles, bean sprouts, and Chinese chives.\n\nWhat makes Penang's version unique is the addition of duck eggs in some stalls, which adds a richer, creamier texture. The best plates are often found in humble street stalls where the 'uncle' or 'auntie' has been perfecting their craft for decades.",
      snippet: "A deep dive into Penang's most famous noodle dish and what makes it so special."
    },
    {
      id: 2,
      title: "George Town: A Living Museum",
      content: "**George Town**, the capital of Penang, was designated a **UNESCO World Heritage Site** in 2008. Walking through its streets is like stepping back in time. You'll see a beautiful blend of British colonial architecture, Chinese shophouses, and Indian temples.\n\nThe city is famous for its narrow alleys, vibrant street art, and the harmonious coexistence of different cultures. It's a place where every corner tells a story of the traders and immigrants who shaped its history.",
      snippet: "Exploring the rich history and architectural beauty of Penang's UNESCO-listed capital."
    },
    {
      id: 3,
      title: "Kek Lok Si: The Temple of Supreme Bliss",
      content: "Perched on a hill in Air Itam, **Kek Lok Si** is the largest Buddhist temple in Malaysia. Its most striking feature is the seven-story **Pagoda of Rama VI**, which combines Chinese, Thai, and Burmese architectural styles.\n\nThe temple is especially breathtaking during Chinese New Year, when thousands of lanterns illuminate the entire complex. Don't miss the giant bronze statue of **Kuan Yin**, the Goddess of Mercy, which stands 30 meters tall.",
      snippet: "Discovering the grandeur and spiritual significance of Malaysia's largest Buddhist temple."
    },
    {
      id: 4,
      title: "Penang Hill: A Breath of Fresh Air",
      content: "To escape the tropical heat, locals and tourists head to **Penang Hill** (Bukit Bendera). Rising 833 meters above sea level, it offers panoramic views of the island and the mainland.\n\nThe best way to reach the top is via the **Penang Hill Funicular**, which has been in operation since 1923. At the summit, you can explore nature trails, visit the Habitat (an eco-park), or simply enjoy a cool breeze at one of the cafes.",
      snippet: "Escape the heat and enjoy breathtaking views from the top of Penang's highest peak."
    },
    {
      id: 5,
      title: "The Baba Nyonya Heritage",
      content: "The **Peranakan** or **Baba Nyonya** culture is a unique blend of Chinese and Malay influences. In Penang, this heritage is beautifully preserved in the **Pinang Peranakan Mansion**.\n\nFrom the intricate beadwork on their shoes to the spicy and tangy flavors of **Nyonya cuisine**, every aspect of their lifestyle is a testament to cultural fusion. Their language, a mix of Hokkien and Malay, is still spoken by some elderly residents today.",
      snippet: "An introduction to the unique and vibrant Peranakan culture of the Straits Settlements."
    },
    {
      id: 6,
      title: "Batu Ferringhi: Sun and Sand",
      content: "For those who love the beach, **Batu Ferringhi** is the place to be. This coastal stretch is lined with luxury resorts, water sports centers, and a famous **night market**.\n\nAs the sun sets, the main road comes alive with stalls selling everything from local handicrafts to 'designer' bags. It's the perfect spot for a seafood dinner by the sea or a relaxing stroll along the sandy shore.",
      snippet: "A guide to the best beaches, night markets, and resorts in Batu Ferringhi."
    },
    {
      id: 7,
      title: "The Blue Mansion: Cheong Fatt Tze",
      content: "The **Cheong Fatt Tze Mansion**, also known as the **Blue Mansion**, is one of Penang's most iconic landmarks. Built in the late 19th century, its vibrant indigo walls and exquisite Feng Shui design are a sight to behold.\n\nThe mansion has won numerous architectural awards and was even featured in the movie *Crazy Rich Asians*. Today, it serves as a boutique hotel and a museum, offering guided tours that delve into the life of the 'Rockefeller of the East'.",
      snippet: "Step inside the award-winning indigo mansion that tells the story of a legendary tycoon."
    },
    {
      id: 8,
      title: "Penang Laksa: A Tangy Delight",
      content: "Unlike the creamy curry laksa found elsewhere, **Penang Asam Laksa** is a tangy, fish-based soup. The broth is made with poached mackerel, tamarind (asam), lemongrass, and chilies.\n\nIt's served with thick rice noodles and topped with shredded cucumber, onions, pineapple, mint, and a dollop of thick prawn paste (heko). It's a complex explosion of sour, spicy, and sweet flavors that has been ranked among the world's best foods.",
      snippet: "Why Penang's tangy Asam Laksa is a must-try for every food lover."
    },
    {
      id: 9,
      title: "The Clan Jetties: Floating Villages",
      content: "The **Clan Jetties** are a series of wooden piers where Chinese immigrant families built their homes over the water in the late 19th century. Each jetty is named after a specific clan, such as the **Chew Jetty** or the **Tan Jetty**.\n\nThese floating villages are still inhabited today, offering a glimpse into a traditional way of life. Visitors can walk along the wooden walkways, browse small souvenir shops, and admire the colorful temples at the end of the piers.",
      snippet: "A walk through the historic wooden piers that house Penang's traditional clan communities."
    },
    {
      id: 10,
      title: "Street Art: The Murals of George Town",
      content: "In 2012, Lithuanian artist **Ernest Zacharevic** transformed the walls of George Town with a series of interactive murals. The most famous is 'Children on a Bicycle', which incorporates a real bicycle into the painting.\n\nSince then, street art has become a major attraction in Penang, with many local and international artists adding their own creations. Hunting for these murals has become a favorite activity for visitors exploring the heritage zone.",
      snippet: "How a series of murals turned the streets of George Town into a global art destination."
    },
    {
      id: 11,
      title: "Tropical Spice Garden: A Lush Oasis",
      content: "Located on the way to Teluk Bahang, the **Tropical Spice Garden** is a bio-diverse paradise featuring over 500 species of flora and fauna. It's built on the site of a former rubber plantation.\n\nGuided tours take you through themed trails where you can learn about the spices that once made Penang a global trading hub. The garden also features a cooking school where you can learn to prepare authentic Malaysian dishes using fresh ingredients.",
      snippet: "Explore the fragrant trails and rich biodiversity of Penang's award-winning spice garden."
    },
    {
      id: 12,
      title: "Entopia: The Butterfly Farm",
      content: "**Entopia** is more than just a butterfly farm; it's a massive nature learning center. The 'Natureland' living garden is home to thousands of free-flying butterflies and various reptiles and insects.\n\nThe 'Cocoon' indoor discovery center offers interactive exhibits and workshops that teach visitors about the life cycles and importance of invertebrates. It's a magical experience for children and adults alike, surrounded by fluttering wings and lush greenery.",
      snippet: "A magical journey through a world of butterflies and nature at Entopia."
    },
    {
      id: 13,
      title: "Durian Season in Penang",
      content: "For many, the arrival of **Durian Season** (usually from May to August) is the highlight of the year. Penang is famous for its high-quality durians, with varieties like **Black Thorn** and **Musang King** being highly sought after.\n\nMany visitors head to the orchards in **Balik Pulau** to enjoy the fruit fresh from the tree. While its strong smell can be polarizing, those who love it describe the taste as a rich, custard-like heaven.",
      snippet: "Everything you need to know about Penang's obsession with the 'King of Fruits'."
    },
    {
      id: 14,
      title: "Thaipusam: A Vibrant Festival",
      content: "**Thaipusam** is a major Hindu festival celebrated with great fervor in Penang. It commemorates the victory of Lord Murugan over evil. The highlight is the procession of devotees carrying 'kavadis' (ornate structures) and performing acts of penance.\n\nThe procession winds its way from the city center to the **Waterfall Hilltop Temple**. The atmosphere is electric, filled with the sound of drums, chanting, and the vibrant colors of traditional attire.",
      snippet: "Experience the spiritual energy and vibrant traditions of the Thaipusam festival in Penang."
    },
    {
      id: 15,
      title: "The Iconic Penang Bridge",
      content: "The **Penang Bridge**, completed in 1985, is one of the longest bridges in Southeast Asia. It spans 13.5 kilometers, connecting the island to the mainland at Seberang Perai.\n\nBefore the bridge, the only way to cross was by ferry. Today, it stands as a symbol of Penang's modernization and economic growth. A second bridge, the **Sultan Abdul Halim Muadzam Shah Bridge**, was opened in 2014 to further improve connectivity.",
      snippet: "The history and significance of the iconic bridge that connects Penang to the world."
    }
  ]
};
