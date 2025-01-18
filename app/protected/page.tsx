import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  return (
    <div className='flex-1 w-full flex flex-col gap-12'>
      <div className='flex flex-col gap-2 items-center justify-center'>
        <Button>
          <Link href='/leaderboard' className='text-accent font-bold'>
            Leaderboard
          </Link>
        </Button>
        <Button>
          <Link href='/game' className='text-accent font-bold'>
            Play the game
          </Link>
        </Button>
      </div>
    </div>
  );
}
