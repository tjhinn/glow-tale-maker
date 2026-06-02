/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify Email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Fredoka', 'Trebuchet MS', sans-serif",
  color: '#0A0A0A',
}
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = {
  fontSize: '24px',
  fontWeight: 600 as const,
  color: '#0A0A0A',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#333',
  lineHeight: '1.6',
  margin: '0 0 22px',
}
const link = { color: '#7A5FFF', textDecoration: 'underline' }
const button = {
  backgroundColor: '#FF8B00',
  color: '#FFFFFF',
  fontSize: '15px',
  borderRadius: '50px',
  padding: '14px 28px',
  textDecoration: 'none',
  fontWeight: 600 as const,
  display: 'inline-block' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '28px 0 0' }
