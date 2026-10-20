"use strict";
const BOSS_BANTER={
 kurohebi:{voice:"theatrical shadow director; stage metaphors, dry menace",lines:[
  ["b","Every shadow in this hall has been rehearsing your entrance. You're late."],
  ["p","Traffic. The void has terrible signage."],
  ["b","Then curtain up. My darkness will play every part, including your last."],
  ["p","Break a leg. I'll start with both of yours."]]},
 jun:{voice:"melancholic rain-walker; soft, apologetic, poetic",lines:[
  ["b","I hoped the rain would keep you indoors. It never listens."],
  ["p","Neither do I. We should start a club."],
  ["b","Then stand still and let the drizzle write your name in the moss."],
  ["p","I'd rather sign it myself. Somewhere dry."]]},
 souko:{voice:"flirtatious florist; charm wrapped around a thorn",lines:[
  ["b","One petal for your courage. One for your funeral. I have plenty of both."],
  ["p","Keep the funeral one. It'll wilt before I do."],
  ["b","Cheeky. I'll seal your smile inside a flower and label it unfinished."],
  ["p","Label it expensive. That's how you'll know it's mine."]]},
 mitsumo:{voice:"skittering centipede swarm; gleeful, restless, many-footed",lines:[
  ["b","A hundred legs, and every one of them wants to meet you personally."],
  ["p","Tell them to form a queue. A very, very long queue."],
  ["b","You joke, but the queue is already circling the ceiling."],
  ["p","Then I'll cut in line. I'm impatient."]]},
 aoji:{voice:"tidal whirlpool duelist; circular logic and condescending calm",lines:[
  ["b","You step into the whirlpool willingly. I admire the stupidity."],
  ["p","It's called confidence. The current just makes it look dramatic."],
  ["b","Round and round you'll go, until your name means nothing but foam."],
  ["p","Foam is still part of the sea. Try harder."]]},
 shou:{voice:"slow, sticky crossroads keeper; deadpan drawl",lines:[
  ["b","At this crossroads, every path ends in slug. Some just take longer."],
  ["p","Then I'll take the shortcut. Point me at the one without slime."],
  ["b","You're standing in it. Mind your shoes."],
  ["p","Great. I was hoping to ruin them on something legendary."]]},
 tsugumi:{voice:"hyperactive racer; engine slang and daredevil glee",lines:[
  ["b","Speed limit? Never met her. But I've met your brakes."],
  ["p","Those were optional anyway. Let's race."],
  ["b","First one to the horizon keeps it. Try not to smear across the finish."],
  ["p","No promises. I look good in motion blur."]]},
 medias:{voice:"icy aristocratic duelist; glass, reflections, zero friction",lines:[
  ["b","This highway is glass. Every step you take is already a reflection of a mistake."],
  ["p","Then I'll make a new one. Variety keeps the pavement honest."],
  ["b","Zero friction. Zero mercy. You will slide exactly where I point."],
  ["p","Careful. Point me at the exit and I might take it."]]},
 kujiru:{voice:"chipper civic booster; gooey municipal pride",lines:[
  ["b","Welcome to the metropolis of slime! Population: me, plus whatever you become."],
  ["p","I'd rather be a tourist. Do you validate parking?"],
  ["b","Parking is free. Leaving is not."],
  ["p","Then I'll take the scenic route through your city hall."]]},
 lumen:{voice:"theatrical sun queen; dazzling, imperious, brittle",lines:[
  ["b","Look at you, squinting in my light. Kneel, and I'll dim it to something survivable."],
  ["p","Keep it bright. I want to see the face you make when I win."],
  ["b","You mistake radiance for generosity. They've never been the same."],
  ["p","Good. I'd hate to thank you."]]},
 iyozane:{voice:"ancient elixir seller; weary, formal, quietly possessive",lines:[
  ["b","I have bottled centuries. Would you like a sip, or shall we skip to the part where you're preserved?"],
  ["p","I've seen your vintage. I'll stick to tap water."],
  ["b","Impertinence. The clan will keep your name in a very small jar."],
  ["p","Make it a big one. I plan to be memorable."]]},
 ooya:{voice:"stern swordmaster; honor, forms, and absolute conviction",lines:[
  ["b","Draw your blade. Evil cannot face it, and neither will you."],
  ["p","That's a lot of faith in a piece of metal. Let's test it."],
  ["b","A blade is not a promise. The cut is."],
  ["p","Then stop talking and sign."]]},
 kaisen:{voice:"golden gambler; coin puns, cheerful greed",lines:[
  ["b","The golden toad says you're due for a lucky break. I say you're due for a debt."],
  ["p","Put it on my tab. I'm good for at least one miracle."],
  ["b","Miracle? In this casino, even the gods pay interest."],
  ["p","Then I'll bankrupt the house. Starting with the toad."]]},
 sese:{voice:"cheerful gravedigger; morbid warmth, underground hospitality",lines:[
  ["b","I dug a grave for every star that fell tonight. There's a spare with your measurements."],
  ["p","Tempting. But I'm not done making new stars."],
  ["b","Then I'll keep the shovel warm. Underground hospitality is all about patience."],
  ["p","I'll bring snacks. You bring the exit."]]},
 hooaka:{voice:"twin-faced mercury duelist; two thoughts colliding",lines:[
  ["b","One of me adores you. The other wants to see what mercury does to a pulse."],
  ["p","Which one gets the final vote?"],
  ["b","Whichever wins. That's the fun part of being two."],
  ["p","Then I'll vote early and often."]]},
 hibaru:{voice:"perky catastrophe analyst; market and weather jargon",lines:[
  ["b","My chart says your survival odds just fell off the table. Want the summary or the crash course?"],
  ["p","Give me the crash. I learn best when everything's on fire."],
  ["b","Then brace for a bull market in bullets. The forecast is red all week."],
  ["p","I'll short the sky."]]},
 kaoru:{voice:"elegant poisoner; sweetened menace, floral precision",lines:[
  ["b","Such a pretty throat. My venom would make it an even prettier apology."],
  ["p","I prefer my apologies unsolicited and poison-free."],
  ["b","How picky. I'll have to make the second one irresistible."],
  ["p","You'll have to catch me first. Spoiler: I'm not a flower."]]},
 garaiya:{voice:"feral playmate; childlike violence, three-against-one",lines:[
  ["b","Three of us, one playground, and no rules. Isn't that exciting?"],
  ["p","One of me, two shoes, and a very low tolerance for tag."],
  ["b","Tag? No, no. We're playing who still has all their ribs."],
  ["p","I'll go first. You three count to ten."]]},
 kuroji:{voice:"brooding gothic duelist; wings, symmetry, bleak wit",lines:[
  ["b","The wings are black because I cut the light out of every greeting. You may keep one feather."],
  ["p","Frame it for me. I'll hang it next to the exit."],
  ["b","You think symmetry means balance. It means I have twice as many ways to catch you."],
  ["p","And I have twice as many reasons to leave."]]},
 sukune:{voice:"explosive ceramic artisan; clay and kiln puns",lines:[
  ["b","Clay remembers every fingerprint. I've made sure mine remember you."],
  ["p","Cute. Do they explode, or is that just a hobby?"],
  ["b","Chain detonation. The first one is an introduction."],
  ["p","Then I'll skip to the credits."]]},
 taira:{voice:"imperious child emperor; bored court, rotating decrees",lines:[
  ["b","You approach the little emperor without a petition. The court is already bored."],
  ["p","I brought a petition: Please move. The court may stamp it."],
  ["b","Rotating court. The stamp will find you eventually."],
  ["p","I'll wait. I've got time and a bad attitude."]]},
 sanra:{voice:"vanishing assassin; terse, dry, ambush-minded",lines:[
  ["b","You won't see the shot. That's not a boast, it's a courtesy."],
  ["p","Thanks. I'll return the favor by not screaming too loud."],
  ["b","No need. I'll be gone before the echo."],
  ["p","Then leave a forwarding address. I collect ghosts."]]},
 para:{voice:"fractured artist; nostalgia, cracks, beautiful decay",lines:[
  ["b","I had a lovely speech for you. I've forgotten the middle and the point."],
  ["p","Start with the ending. Those are usually the honest part."],
  ["b","The ending has a crack in it. Please don't fall through."],
  ["p","No promises. I like broken frames. They let the light in."]]},
 clause:{voice:"cosmic architect; remote, monumental, star-distance metaphors",lines:[
  ["b","I built a wall from the distance between stars. You are still on the wrong side."],
  ["p","Your wall has a door. I can see the hinges."],
  ["b","That is not a door. That is where the wall intends to close."],
  ["p","Then I'll knock first. Wouldn't want to be rude."]]},
 yaorochi:{voice:"severe sword saint; sky-cutting, formal, absolute",lines:[
  ["b","I cut the sky once. It has been quieter ever since. You will be quieter too."],
  ["p","I liked the sky loud. Guess I'm here to complain."],
  ["b","Then raise your blade. Let us see if your complaint has an edge."],
  ["p","It does. It's mostly punctuation."]]},
 saragimaru:{voice:"regal collector; three treasures, appraisal, velvet threat",lines:[
  ["b","Mirror, sword, jewel. Each one has already decided you're not enough."],
  ["p","Three opinions and none of them asked me? Rude."],
  ["b","The mirror shows your fear. The sword will test it. The jewel will keep the receipt."],
  ["p","Tell the jewel I want a refund and a rematch."]]},
 shion:{voice:"chimera with three competing heads; comic chaos",lines:[
  ["b","My left head wants your spell cards. My right head wants your shoes. The middle one wants a rematch."],
  ["p","The shoes are non-negotiable. The rematch is negotiable."],
  ["b","The middle head says you're interesting. The other two are still voting."],
  ["p","Majority rule. Let's give them something to argue about."]]},
 mitori:{voice:"elegant seamstress of red rivers; crimson thread, poise",lines:[
  ["b","Every red river needs a seamstress. I've been weaving yours since you walked in."],
  ["p","Then you know my measurements. Make it something that doesn't stain."],
  ["b","Crimson is the only color that lasts. You'll look lovely in it."],
  ["p","I'll take it in black. I'm difficult like that."]]},
 chouki:{voice:"bitter seamstress; needles, grudges, precise threats",lines:[
  ["b","I stitch grudges into the seams of the world. Yours is already threaded."],
  ["p","Pull it tight. I hate loose endings."],
  ["b","Careful. Once I sew a soul shut, it stays shut."],
  ["p","Then leave a button open. I may want out."]]},
 haiji:{voice:"drowsy dream-lock keeper; languid blink logic",lines:[
  ["b","Between one blink and the next, I lock a dream. You've already missed three."],
  ["p","Then stop blinking. I'm trying to concentrate."],
  ["b","If you sleep here, you'll wake up in a version of yourself that lost."],
  ["p","Joke's on you. That version still has my shoes."]]},
 yago:{voice:"arrogant sculptor; unfinished masterpieces and cutting critique",lines:[
  ["b","You're a rough sketch. I could finish you with one careful line."],
  ["p","Make it a flattering one. The critics are watching."],
  ["b","Critics? I am the critic. And I've decided you're unfinished."],
  ["p","Good. I'd hate to be a masterpiece and have nothing left to do."]]},
 xeno:{voice:"all-in gambler; dice, deeds, showman swagger",lines:[
  ["b","The house always wins. Tonight, the house is me, and I'm feeling generous."],
  ["p","Generous? I'll take the deed and a free drink."],
  ["b","All-in, then. Your confidence against my dice."],
  ["p","Roll them. I'll be counting from the other side of the table."]]},
 tenkai:{voice:"territorial crane warden; old-fashioned boundary pride",lines:[
  ["b","This perch has held the sky for a thousand years. You are a very loud inconvenience."],
  ["p","Then move over. Even cranes need to stretch."],
  ["b","One more step and I'll fold the boundary around your ankles."],
  ["p","Try it. I've been meaning to learn origami."]]},
 kokoro:{voice:"mask seller and exorcist; theatrical, unsettling empathy",lines:[
  ["b","I sell faces. Yours is a little out of fashion, but I could make it honest."],
  ["p","Keep the face. I'm using it."],
  ["b","Then I'll exorcise what's behind it. The heart always pays full price."],
  ["p","Charge it to the mask. It's been lying for me all week."]]},
 suzumi:{voice:"scarred vindictive rival; memory as a weapon",lines:[
  ["b","I kept every scar you gave me. I want them back with interest."],
  ["p","I don't do refunds. But I can add a matching set."],
  ["b","You think pain is a receipt? I remember what you forgot."],
  ["p","Then remind me after I win. I'll take notes."]]},
 shitodo:{voice:"chaotic household trio; domestic mayhem, overlapping voices",lines:[
  ["b","Welcome home! The dishes are undone, the roof is on fire, and you're late for dinner."],
  ["p","I didn't know I lived here. The rent must be terrible."],
  ["b","Rent is paid in chaos. You're already three months behind."],
  ["p","Fine. I'll do the dishes on my way out."]]},
 preschool:{voice:"eerie undead kindergarten teacher; cheerful playtime menace",lines:[
  ["b","Recess is over! Everyone line up for naptime. Forever."],
  ["p","I'll pass. I'm allergic to eternal naps."],
  ["b","Then you can be the sandbox. The children love digging."],
  ["p","I charge admission. Haniwa get a discount."]]},
 emperor:{voice:"bureaucratic tyrant; decrees, forms, rigid order",lines:[
  ["b","By the First Decree, your presence is illegal. File an appeal, then die."],
  ["p","Appeal: you're in my way. Form 27-B."],
  ["b","Form 27-B was abolished. The Order Absolute does not suffer paperwork."],
  ["p","Then I'll submit a verbal complaint. Repeatedly."]]},
 brokenteam:{voice:"broken serpent trio; glitchy coordination, dark comedy",lines:[
  ["b","Triple Mow. Three of us, one waltz, and absolutely no choreography."],
  ["p","I can hear the music falling apart from here."],
  ["b","That's the point. Fractured waltz. You'll be the crack in the floor."],
  ["p","Great. I'll bring a broom."]]},
 jinbei:{voice:"cheerful mad inventor; prototypes and warranty jokes",lines:[
  ["b","I built this weapon in one night. It's never been tested. Want to be the footnote?"],
  ["p","Only if the footnote says it worked."],
  ["b","Optimism! I'll need that for the warranty."],
  ["p","Warranty? You're already making me nervous."]]},
 yabusameX:{voice:"confident hero; parallel worlds and sequel logic",lines:[
  ["b","In another world, you already lost this fight. I'm here to make it canon."],
  ["p","Then in another world, I'm already celebrating. Try to keep up."],
  ["b","Parallel worlds collide, little traveler. You're standing in the crash."],
  ["p","Good. I've always wanted to see the multiverse lose."]]},
 tsurubami:{voice:"monochrome calligrapher; void ink, successor blade, final-boss gravity",lines:[
  ["b","I painted the sky white to forget it. You arrived with too much color."],
  ["p","You missed a spot. Right where I'm standing."],
  ["b","Ink of the void will correct that. Your silhouette will make a fine seal."],
  ["p","Sign it Suzuran. I want the credit."]]},
 suzumiex:{voice:"unhinged crimson idol; manic refrains, scar and echo",lines:[
  ["b","Tsu-ba-ku-raaa~! I remember every scar, every song, every broken little encore!"],
  ["p","You're going to have to narrow that down."],
  ["b","Then I'll just take everything! Face, voice, the pretty way you lose!"],
  ["p","No encore. I'm cutting the mic."]]},
 shrineteam:{voice:"chorus of shrine revenants; holy menace, erased world",lines:[
  ["b","We drained the color from this world. Your spark is a stain we intend to remove."],
  ["p","Stains are stubborn. Ask anyone who's done laundry."],
  ["b","Black blade, soul seal. We will engrave your name on the empty side of the sky."],
  ["p","Use good handwriting. I want it legible from the winner's podium."]]}
};
let _aiBanter={};
function cleanBanterLine(text,max){
 return String(text||"").replace(/[<>&"\x00-\x1f\x7f]/g,"").replace(/\s+/g," ").trim().substring(0,max||160);
}
function banterParts(line){
 if(Array.isArray(line))return {who:line[0],text:line[1]};
 return {who:line&&line.who,text:line&&line.text};
}
function validBanter(lines){
 if(!Array.isArray(lines)||lines.length!==4)return false;
 for(let i=0;i<4;i++){
  const line=banterParts(lines[i]);
  if(line.who&&line.who!==(i%2===0?"b":"p"))return false;
  if(!cleanBanterLine(line.text,160))return false;
 }
 return true;
}
function normalizeBanter(lines){
 return lines.map((line,i)=>{
  const parts=banterParts(line);
  return [i%2===0?"b":"p",cleanBanterLine(parts.text,160)];
 });
}
function setAiBanter(id,lines){
 if(!id||!validBanter(lines))return false;
 _aiBanter[id]=normalizeBanter(lines);
 return true;
}
function clearAiBanter(id){
 if(id)_aiBanter[id]=null;
 else _aiBanter={};
}
function hasAiBanter(id){
 return !!id&&validBanter(_aiBanter[id]);
}
function getBossBanter(def){
 const cached=_aiBanter[def.id];
 if((typeof G==='undefined'||G.aiDialogue!==false)&&validBanter(cached))return cached.map(line=>[line[0],line[1]]);
 const base=BOSS_BANTER[def.id];
 if(base&&validBanter(base.lines))return base.lines.map(line=>[line[0],line[1]]);
 const name=def.name||"This guardian";
 return [
  ["b",name+" has been waiting for someone foolish enough to reach this boundary."],
  ["p","Then I hope the wait was worth it."],
  ["b","It will be. I have prepared a very personal welcome."],
  ["p","Good. I hate generic hospitality."]
 ];
}
function bossBanterVoice(def){
 return (BOSS_BANTER[def.id]&&BOSS_BANTER[def.id].voice)||"proud boundary guardian; dry, observant, dangerous";
}
