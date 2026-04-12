export const SUI_CONFIG = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,
  moduleName: process.env.NEXT_PUBLIC_MODULE_NAME!,
  functionName: process.env.NEXT_PUBLIC_FUNCTION_NAME!,
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet') || 'testnet',
} as const;

export const SKILL_TAGS = [
  'Event Logistics',
  'Technical Mentoring',
  'Community Management',
  'Frontend Development',
  'Smart Contract Development',
  'Backend Development',
  'B2B Negotiation',
  'Content Creation',
  'Project Management',
  'Public Speaking',
  'UI/UX Design',
  'Social Media Marketing',
  'Workshop Facilitation',
  'Graphic Design',
  'Data Analysis',
] as const;

export type SkillTag = (typeof SKILL_TAGS)[number];

export const SUI_ADDRESS_REGEX = /^0x[a-fA-F0-9]{64}$/;
