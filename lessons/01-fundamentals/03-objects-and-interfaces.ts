// Lesson 03: Objects & Interfaces
// Run with: npx ts-node --esm lessons/01-fundamentals/03-objects-and-interfaces.ts

// =============================================================================
// 1. OBJECT TYPES (inline)
// =============================================================================

// Python: you'd use a dict, a dataclass, or a TypedDict
// TS: objects are THE fundamental data structure (like Python dicts, but typed)

// Inline type annotation:
const user: { name: string; age: number; email: string } = {
  name: "Morgan",
  age: 30,
  email: "morgan@example.com",
};

console.log(`${user.name}, ${user.age}, ${user.email}`);

// Key differences from Python dicts:
// - Dot notation access (user.name), not user["name"] (though that works too)
// - Keys are NOT strings — they're fixed property names
// - TypeScript checks that you only access properties that exist
// - No KeyError at runtime — TS catches missing props at compile time

// Try uncommenting this — TS will error:
// console.log(user.phone);

// =============================================================================
// 2. INTERFACES — naming your object shapes
// =============================================================================

// Python equivalent: @dataclass or TypedDict
// TS: `interface` defines the shape of an object

interface User {
  name: string;
  age: number;
  email: string;
}

const user2: User = {
  name: "Alex",
  age: 28,
  email: "alex@example.com",
};

// This will error — missing required property:
// const badUser: User = { name: "Bad" };

// This will also error — extra property:
// const extraUser: User = { name: "Extra", age: 25, email: "e@e.com", phone: "555" };

console.log(`User2: ${user2.name}`);

// =============================================================================
// 3. OPTIONAL PROPERTIES
// =============================================================================

// Same `?` syntax as optional function parameters

interface UserProfile {
  name: string;
  email: string;
  bio?: string; // string | undefined
  avatarUrl?: string;
}

const minimalProfile: UserProfile = {
  name: "Morgan",
  email: "morgan@example.com",
};

const fullProfile: UserProfile = {
  name: "Morgan",
  email: "morgan@example.com",
  bio: "TypeScript learner",
  avatarUrl: "https://example.com/avatar.png",
};

console.log(`\nMinimal: ${minimalProfile.name}, bio: ${minimalProfile.bio}`);
console.log(`Full: ${fullProfile.name}, bio: ${fullProfile.bio}`);

// =============================================================================
// 4. READONLY PROPERTIES
// =============================================================================

// Python: frozen=True on a dataclass
// TS: `readonly` keyword on individual properties

interface Config {
  readonly host: string;
  readonly port: number;
  debug: boolean; // this one is mutable
}

const config: Config = {
  host: "localhost",
  port: 3000,
  debug: true,
};

config.debug = false; // OK
// config.host = "0.0.0.0"; // Error! Cannot assign to 'host' because it is read-only

console.log(`\nConfig: ${config.host}:${config.port} (debug: ${config.debug})`);

// =============================================================================
// 5. TYPE ALIASES vs INTERFACES
// =============================================================================

// Both can describe object shapes. When do you use which?

// Interface — can be extended, merged, best for object shapes:
interface Animal {
  name: string;
  sound: string;
}

// Type alias — can describe ANY type, not just objects:
type Point = { x: number; y: number };
type ID = string | number; // union — interfaces can't do this
type Pair = [string, number]; // tuple — interfaces can't do this

const origin: Point = { x: 0, y: 0 };
const userId: ID = "abc-123";
const pair: Pair = ["hello", 42];

console.log(`\nPoint: (${origin.x}, ${origin.y})`);
console.log(`ID: ${userId}`);
console.log(`Pair: ${pair}`);

// Rule of thumb:
// - Use `interface` for objects that will be implemented or extended
// - Use `type` for unions, tuples, or when you need type operations
// - Either works for simple object shapes — pick one and be consistent

// =============================================================================
// 6. EXTENDING INTERFACES
// =============================================================================

// Python: class inheritance or Protocol composition
// TS: `extends` keyword

interface BaseEntity {
  id: string;
  createdAt: Date;
}

interface Post extends BaseEntity {
  title: string;
  body: string;
  published: boolean;
}

const post: Post = {
  id: "post-1",
  createdAt: new Date(),
  title: "Learning TypeScript",
  body: "Objects and interfaces are great!",
  published: true,
};

console.log(`\nPost: "${post.title}" (id: ${post.id})`);

// You can extend multiple interfaces:
interface Timestamped {
  updatedAt: Date;
}

interface Comment extends BaseEntity, Timestamped {
  text: string;
  authorId: string;
}

const comment: Comment = {
  id: "comment-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  text: "Great post!",
  authorId: "user-1",
};

console.log(`Comment: "${comment.text}" by ${comment.authorId}`);

// =============================================================================
// 7. INTERSECTION TYPES (the `type` way to combine)
// =============================================================================

// Python: no direct equivalent
// TS: `&` combines types (like set intersection of required properties)

type WithId = { id: string };
type WithTimestamp = { createdAt: Date };
type WithMetadata = WithId & WithTimestamp;

// Equivalent to an interface with both id and createdAt
type Article = WithMetadata & {
  title: string;
  content: string;
};

const article: Article = {
  id: "article-1",
  createdAt: new Date(),
  title: "Intersection Types",
  content: "They combine types with &",
};

console.log(`\nArticle: "${article.title}" (id: ${article.id})`);

// =============================================================================
// 8. NESTED OBJECTS
// =============================================================================

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Company {
  name: string;
  address: Address;
  employees: User[]; // Array of User objects!
}

const company: Company = {
  name: "Acme Corp",
  address: {
    street: "123 Main St",
    city: "Springfield",
    state: "IL",
    zip: "62701",
  },
  employees: [
    { name: "Morgan", age: 30, email: "morgan@acme.com" },
    { name: "Alex", age: 28, email: "alex@acme.com" },
  ],
};

console.log(`\nCompany: ${company.name}`);
console.log(`Address: ${company.address.city}, ${company.address.state}`);
console.log(`Employees: ${company.employees.map((e) => e.name).join(", ")}`);

// =============================================================================
// 9. INDEX SIGNATURES (dynamic keys)
// =============================================================================

// Python: Dict[str, int]
// TS: index signature

interface ScoreBoard {
  [playerName: string]: number;
}

const scores: ScoreBoard = {
  Morgan: 100,
  Alex: 85,
  Sam: 92,
};

scores["Jordan"] = 88; // Can add new keys
console.log(`\nScores:`, scores);

// You can combine index signatures with fixed properties:
interface ApiResponse {
  status: number;
  message: string;
  [key: string]: unknown; // additional dynamic fields
}

const response: ApiResponse = {
  status: 200,
  message: "OK",
  data: { users: [] },
  requestId: "abc-123",
};

console.log(`Response: ${response.status} ${response.message}`);

// =============================================================================
// 10. STRUCTURAL TYPING ("duck typing" at compile time)
// =============================================================================

// This is a BIG concept. Python's Protocol is the closest equivalent.
// TS doesn't care about the NAME of the type — only the SHAPE.

interface HasName {
  name: string;
}

function printName(thing: HasName): void {
  console.log(`Name: ${thing.name}`);
}

// All of these work — they all have a `name` property:
printName({ name: "Morgan" });
printName(user2); // User has name
printName(company); // Company has `name` ✓

// This is structural typing: if the shape fits, it works.
// No need to explicitly "implement" an interface (unlike Java/C#).

console.log("\n--- Lesson 03 complete --- objects & interfaces");

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Define an interface `Song` with: title (string), artist (string),
//    durationSeconds (number), and an optional albumName.
//    Create two Song objects — one with and one without albumName.
interface Song {
  title: string,
  artist: string,
  durationSeconds: number,
  albumName?: string,
};

const song1: Song = {
  title: "Sing it loud",
  artist: "me",
  durationSeconds: 180,
  albumName: "myFirstAlbum",
};

const song2: Song = {
  title: "Sing it loud single",
  artist: "me",
  durationSeconds: 180,
};
//
// 2. Define a `Playlist` interface that has: name (string), songs (Song[]),
//    and a readonly createdBy (string).
//    Create a Playlist with at least 2 songs.
interface Playlist {
  name: string,
  songs: Song[],
  readonly createdBy: string
};

const playlist1: Playlist = {
  name: "myPlaylist",
  songs: [song1, song2],
  createdBy: "me",
}
//
// 3. Write a function `totalDuration` that takes a Playlist and returns
//    the total duration in seconds. Use reduce or a for loop.
const totalDuration = (playlist: Playlist): number => {
  return playlist.songs.reduce(
    (total, nextSong) => total + nextSong.durationSeconds, 0,
  );
};
console.log(totalDuration(playlist1))
//
// 4. (Bonus) Define a type `Formatter` = (song: Song) => string.
//    Write two formatters: one that returns "Artist - Title" and one
//    that returns "Title (Xm Ys)". Pass them to a function that formats
//    all songs in a playlist.
type Formatter = (song: Song) => string;

const toTitleCase = (s: string) => {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

const artistTitleFormatter: Formatter = (song) => {
  return `${toTitleCase(song.artist)} - ${toTitleCase(song.title)}`;
};

const titleDurationFormatter: Formatter = (song) => {
  const minutes = Math.floor(song.durationSeconds / 60);
  const seconds = song.durationSeconds % 60;
  return `${toTitleCase(song.title)} (${minutes}m ${seconds}s)`;
};

const formatSongs = (playlist: Playlist, formatter: Formatter): string[] => {
  return playlist.songs.map(formatter);
};

console.log(formatSongs(playlist1, artistTitleFormatter))

console.log(formatSongs(playlist1, titleDurationFormatter))
