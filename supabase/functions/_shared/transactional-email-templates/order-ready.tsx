/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface OrderReadyProps {
  heroName?: string
  storyTitle?: string
  pdfUrl?: string
}

const OrderReadyEmail = ({
  heroName = 'Little Hero',
  storyTitle = 'Your Magical Storybook',
  pdfUrl = '#',
}: OrderReadyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`✨ ${heroName}'s very own fairy tale is ready to read tonight.`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={sparkle}>✨ 📖 ✨</Text>
          <Heading style={headerHeading}>
            {heroName}'s Story is Ready
          </Heading>
        </Section>

        <Section style={bodySection}>
          <Text style={greeting}>Hi there 👋</Text>
          <Text style={paragraph}>
            Something magical just happened. <strong>{heroName}'s</strong> very
            own fairy tale — <em style={italicAccent}>"{storyTitle}"</em> — has
            been lovingly illustrated, page by page, and is ready to be read
            tonight.
          </Text>
          <Text style={paragraph}>
            Every sparkle, every brushstroke, every word — made just for{' '}
            {heroName}.
          </Text>

          <Text style={divider}>✦ ✦ ✦</Text>
          <Text style={tagline}>Turn the page — the magic begins…</Text>
        </Section>

        <Section style={ctaSection}>
          <Button style={button} href={pdfUrl}>
            📖 Open {heroName}'s Storybook
          </Button>
        </Section>

        <Section style={noteSection}>
          <Text style={noteText}>
            <strong style={noteStrong}>📅 Save the magic.</strong> Your
            download link will be available for <strong>1 month</strong>. Save
            the storybook to your device so {heroName} can revisit the
            adventure anytime.
          </Text>
        </Section>

        <Section style={signOff}>
          <Text style={paragraph}>
            With love and a little bit of magic, ✨
            <br />
            <strong style={signature}>The ArtBookMagic Team</strong>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderReadyEmail,
  subject: (data: Record<string, any>) =>
    `✨ ${data.heroName ?? 'Your'} storybook has arrived`,
  displayName: 'Order ready (customer)',
  previewData: {
    heroName: 'Mia',
    storyTitle: 'The Brave Little Adventurer',
    pdfUrl: 'https://example.com/storybook.pdf',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Fredoka', 'Trebuchet MS', 'Comic Sans MS', sans-serif",
  color: '#0A0A0A',
}
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0',
}
const header = {
  background: 'linear-gradient(135deg, #FF8B00 0%, #FFB347 50%, #FFE97F 100%)',
  padding: '48px 32px',
  textAlign: 'center' as const,
  borderRadius: '16px 16px 0 0',
}
const sparkle = {
  fontSize: '32px',
  margin: '0 0 12px',
  lineHeight: '1',
}
const headerHeading = {
  margin: '0',
  fontSize: '30px',
  fontWeight: 600 as const,
  color: '#FFFFFF',
  letterSpacing: '-0.5px',
}
const bodySection = { padding: '40px 36px 16px 36px' }
const greeting = {
  margin: '0 0 20px',
  fontSize: '18px',
  fontWeight: 600 as const,
}
const paragraph = {
  margin: '0 0 18px',
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.65',
}
const italicAccent = { color: '#7A5FFF', fontStyle: 'italic' as const }
const divider = {
  textAlign: 'center' as const,
  margin: '8px 0 24px',
  color: '#7A5FFF',
  letterSpacing: '8px',
  fontSize: '14px',
}
const tagline = {
  margin: '0 0 28px',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
  color: '#7A5FFF',
  fontSize: '15px',
}
const ctaSection = { padding: '0 36px 32px', textAlign: 'center' as const }
const button = {
  backgroundColor: '#FF8B00',
  color: '#FFFFFF',
  textDecoration: 'none',
  padding: '18px 44px',
  borderRadius: '50px',
  fontWeight: 600 as const,
  fontSize: '18px',
  display: 'inline-block',
}
const noteSection = { padding: '0 36px 32px' }
const noteText = {
  backgroundColor: '#FFF8E1',
  borderLeft: '4px solid #FFE97F',
  borderRadius: '8px',
  padding: '16px 18px',
  fontSize: '14px',
  color: '#5C5043',
  lineHeight: '1.55',
  margin: '0',
}
const noteStrong = { color: '#0A0A0A' }
const signOff = { padding: '0 36px 40px' }
const signature = { color: '#0A0A0A' }