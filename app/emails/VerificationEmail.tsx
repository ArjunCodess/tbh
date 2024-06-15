import { Html, Head, Font, Preview, Heading, Row, Section, Text, Link } from '@react-email/components';

interface VerificationEmailProps {
     username: string;
     otp: string;
}

export default function VerificationEmail({ username, otp }: VerificationEmailProps) {
     return (
          <Html lang="en" dir="ltr">
               <Head>
                    <title>Verification Code</title>
                    <Font
                         fontFamily="Roboto"
                         fallbackFontFamily="Verdana"
                         webFont={{
                              url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
                              format: 'woff2',
                         }}
                         fontWeight={400}
                         fontStyle="normal"
                    />
               </Head>
               <Preview>Here&apos;s your verification code: {otp}</Preview>
               <Section>
                    <Row>
                         <Heading as="h2">
                              Hello, @{username}!
                         </Heading>
                    </Row>
                    <Row>
                         <Text>
                              Thank you for registering with us! To finish setting up your account, please enter this code:
                         </Text>
                    </Row>
                    <Row>
                         <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                              <strong>{otp}</strong>
                         </Heading>
                    </Row>
                    <Row>
                         <Text>
                              If you did not request this code, please ignore this email.
                         </Text>
                    </Row>
                    <Row>
                         {/* update the link to the deployed version */}
                         <Text>
                              Or visit this link: <Link href={`/verify/${username}`} className="text-blue-600 no-underline">{"Verify My Account"}</Link>
                         </Text>
                    </Row>
               </Section>
          </Html>
     );
}