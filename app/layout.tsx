import HeaderAuth from '@/components/header-auth';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Our Dream',
  description: 'dreams come true',
};

const geistSans = Geist({
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={geistSans.className} suppressHydrationWarning>
      <body className='bg-background text-foreground'>
        <main className='min-h-screen flex flex-col items-center'>
          {/* 헤더 네비게이션을 fixed로 설정하고 배경색 추가 */}
          <nav className='fixed top-0 left-0 right-0 flex justify-center border-b border-b-foreground/10 h-16 bg-background z-50'>
            <div className='w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm'>
              <div className='flex gap-5 items-center font-semibold'>
                <Link href={'/'}>Our Dream</Link>
              </div>
              <HeaderAuth />
            </div>
          </nav>

          {/* 내부 컨텐츠를 헤더 높이만큼 아래로 밀어주고, 높이를 화면에서 헤더 높이를 뺀 만큼으로 설정 */}
          <div className='flex-1 w-full flex flex-col justify-start items-center pt-16'>
            <div className='flex flex-col w-full max-w-5xl h-[calc(100vh-4rem)]'>
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
