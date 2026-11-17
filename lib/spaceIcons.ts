import {
  Anchor, Apple, Atom, Award, Bell, Bike, Bird, Book, Bookmark, Bot, Box, Brain, Briefcase, Brush, Bug,
  Building2, Cake, Calendar, Camera, Car, Cat, ClipboardList, Clock, Cloud, Code, Coffee, Cog, Compass,
  Cpu, CreditCard, Crown, Database, Diamond, DollarSign, Dog, Dumbbell, FileText, Film, Fish, Flag, Flame,
  FlaskConical, Flower2, Folder, Gamepad2, Gem, Gift, Globe, GraduationCap, Hammer, Handshake, Hash, Headphones,
  Heart, House, Image, Key, Landmark, Laptop, Layers, Leaf, Lightbulb, ListChecks, Lock, Mail, Map, MapPin,
  Megaphone, MessageSquare, Mic, Microscope, Monitor, Moon, Mountain, Music, Newspaper, Package, Palette,
  PenTool, Pencil, Phone, PieChart, Pill, Pizza, Plane, Presentation, Printer, Puzzle, Radio, Rocket, Scale,
  Scissors, Server, Settings, Shield, ShoppingBag, ShoppingCart, Smartphone, Snowflake, Sparkles, Star,
  Stethoscope, Sun, Tag, Target, Terminal, TreePine, TrendingUp, Trophy, Truck, Umbrella, Users, Video,
  Wallet, Waves, Wifi, Wine, Wrench, Zap, BarChart3, Activity,
  type LucideIcon,
} from 'lucide-react';

/** Icons a space can use. The key is what gets stored in the database. */
export const SPACE_ICONS: Record<string, LucideIcon> = {
  activity: Activity, anchor: Anchor, apple: Apple, atom: Atom, award: Award, 'bar-chart': BarChart3,
  bell: Bell, bike: Bike, bird: Bird, book: Book, bookmark: Bookmark, bot: Bot, box: Box, brain: Brain,
  briefcase: Briefcase, brush: Brush, bug: Bug, building: Building2, cake: Cake, calendar: Calendar,
  camera: Camera, car: Car, cat: Cat, clipboard: ClipboardList, clock: Clock, cloud: Cloud, code: Code,
  coffee: Coffee, cog: Cog, compass: Compass, cpu: Cpu, 'credit-card': CreditCard, crown: Crown,
  database: Database, diamond: Diamond, dollar: DollarSign, dog: Dog, dumbbell: Dumbbell, file: FileText,
  film: Film, fish: Fish, flag: Flag, flame: Flame, flask: FlaskConical, flower: Flower2, folder: Folder,
  gamepad: Gamepad2, gem: Gem, gift: Gift, globe: Globe, graduation: GraduationCap, hammer: Hammer,
  handshake: Handshake, hash: Hash, headphones: Headphones, heart: Heart, home: House, image: Image,
  key: Key, landmark: Landmark, laptop: Laptop, layers: Layers, leaf: Leaf, lightbulb: Lightbulb,
  checklist: ListChecks, lock: Lock, mail: Mail, map: Map, pin: MapPin, megaphone: Megaphone,
  message: MessageSquare, mic: Mic, microscope: Microscope, monitor: Monitor, moon: Moon,
  mountain: Mountain, music: Music, newspaper: Newspaper, package: Package, palette: Palette,
  'pen-tool': PenTool, pencil: Pencil, phone: Phone, 'pie-chart': PieChart, pill: Pill, pizza: Pizza,
  plane: Plane, presentation: Presentation, printer: Printer, puzzle: Puzzle, radio: Radio, rocket: Rocket,
  scale: Scale, scissors: Scissors, server: Server, settings: Settings, shield: Shield, bag: ShoppingBag,
  cart: ShoppingCart, smartphone: Smartphone, snowflake: Snowflake, sparkles: Sparkles, star: Star,
  stethoscope: Stethoscope, sun: Sun, tag: Tag, target: Target, terminal: Terminal, tree: TreePine,
  trending: TrendingUp, trophy: Trophy, truck: Truck, umbrella: Umbrella, users: Users, video: Video,
  wallet: Wallet, waves: Waves, wifi: Wifi, wine: Wine, wrench: Wrench, zap: Zap,
};

export const SPACE_ICON_NAMES = Object.keys(SPACE_ICONS);

export const SPACE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#64748b', '#84cc16', '#f97316', '#14b8a6',
];
