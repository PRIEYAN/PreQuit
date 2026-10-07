/**
 * Stand-in chat history while the app is not wired to the API. Keyed by the
 * chat id the list passes through, so opening a conversation shows that
 * person's own history rather than one shared script.
 *
 * `mine` marks a message sent by the signed-in user, which is all the bubble
 * needs to pick a side. Once messaging is connected this maps to comparing
 * senderId against the viewer.
 */
const THREADS = {
  1: [
    { id: 'm1', mine: false, text: 'Did you get a look at the launch checklist?', time: '09:12' },
    { id: 'm2', mine: true, text: 'Yeah, went through it this morning. Two things still open.', time: '09:20' },
    { id: 'm3', mine: false, text: 'Which ones?', time: '09:21' },
    { id: 'm4', mine: true, text: 'Analytics keys and the store screenshots.', time: '09:24' },
    { id: 'm5', mine: false, text: "I'll take the screenshots, you handle the keys?", time: '09:31' },
    { id: 'm6', mine: true, text: 'Deal.', time: '09:33' },
    { id: 'm7', mine: false, text: 'See you at the launch 🚀', time: '09:42' },
  ],
  2: [
    { id: 'm1', mine: false, text: 'Morning! Starting on the settings screen today.', time: '07:48' },
    { id: 'm2', mine: true, text: 'Nice. Are you keeping the glass cards?', time: '07:55' },
    { id: 'm3', mine: false, text: 'Yeah, they read really well on black.', time: '08:02' },
    { id: 'm4', mine: false, text: 'Sent the mockups over', time: '08:15' },
  ],
  3: [
    { id: 'm1', mine: true, text: 'Hey, did the build finish?', time: 'Yesterday' },
    { id: 'm2', mine: false, text: 'Still going. Gradle is being Gradle.', time: 'Yesterday' },
    { id: 'm3', mine: true, text: 'Ha, classic.', time: 'Yesterday' },
    { id: 'm4', mine: false, text: 'Typing...', time: 'Yesterday' },
  ],
  4: [
    { id: 'm1', mine: false, text: 'Pushed the fix to main.', time: 'Yesterday' },
    { id: 'm2', mine: true, text: 'You: got it, thanks!', time: 'Yesterday' },
  ],
  5: [
    { id: 'm1', mine: false, text: 'Voice message (0:12)', time: 'Tuesday' },
    { id: 'm2', mine: true, text: "Can't listen right now, I'll catch it tonight.", time: 'Tuesday' },
  ],
  6: [
    { id: 'm1', mine: false, text: 'Are we still on for tonight?', time: 'Monday' },
  ],
  7: [
    { id: 'm1', mine: true, text: 'You would not believe what happened at standup', time: 'Monday' },
    { id: 'm2', mine: false, text: 'Haha that was wild 😄', time: 'Monday' },
  ],

  // Feed authors, keyed the way mockPosts builds their id (`u_<handle>`), so
  // tapping a post author opens a real conversation instead of a blank thread.
  u_atlas: [
    { id: 'm1', mine: false, text: 'That overhang project finally went down today.', time: '11:02' },
    { id: 'm2', mine: true, text: 'Six sessions? That is persistence.', time: '11:15' },
    { id: 'm3', mine: false, text: 'Beta was all in the footwork. I was overgripping the whole time.', time: '11:18' },
    { id: 'm4', mine: true, text: 'Always is. Congrats 🎉', time: '11:20' },
  ],
  u_rio: [
    { id: 'm1', mine: true, text: 'Your crumb shot looked unreal. What hydration?', time: '08:30' },
    { id: 'm2', mine: false, text: 'Ninety percent, twelve hour cold retard.', time: '08:41' },
    { id: 'm3', mine: false, text: 'Warm kitchen does most of the work honestly.', time: '08:42' },
    { id: 'm4', mine: true, text: 'Mine doubles in about eight hours. Clearly too cold.', time: '08:50' },
  ],
  u_nova: [
    { id: 'm1', mine: false, text: 'Shot the whole roll at golden hour.', time: '17:05' },
    { id: 'm2', mine: true, text: 'The light is doing all the work there.', time: '17:12' },
    { id: 'm3', mine: false, text: 'Metering for shadows changed everything for me.', time: '17:14' },
  ],
  u_sage: [
    { id: 'm1', mine: true, text: 'Tomatoes went in late this year and I am panicking.', time: 'Yesterday' },
    { id: 'm2', mine: false, text: 'Mine were three weeks late and outpaced last season.', time: 'Yesterday' },
    { id: 'm3', mine: false, text: 'Compost is just patience with a smell.', time: 'Yesterday' },
    { id: 'm4', mine: true, text: 'Putting that on a mug.', time: 'Yesterday' },
  ],
  u_mira: [
    { id: 'm1', mine: false, text: 'Trimmed the foot too thin and it cracked in the bisque.', time: 'Tuesday' },
    { id: 'm2', mine: true, text: 'Ouch. Starting over?', time: 'Tuesday' },
    { id: 'm3', mine: false, text: 'Already back on the wheel. Celadon over dark stoneware this time.', time: 'Tuesday' },
  ],
};

/** Unknown ids open an empty thread rather than crashing the screen. */
export const threadFor = chatId => THREADS[chatId] ?? [];

export default THREADS;
