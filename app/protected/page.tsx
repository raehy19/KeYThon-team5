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
    <div className='flex-1 w-full flex flex-col gap-12 p-4'>
      <div className='flex flex-col gap-4 items-center justify-center'>
        <div>
          어느 날, 낮잠에 깬 나는 라디오에서 들려온 코요테의 '꿈'이라는 노래를
          듣게 된다.. 압도적인 무대와 목소리에 매료되었지만, 동시에 도전하고
          싶다는 열망이 피어올랐다. 그 순간, 코요테의 목소리가 들려왔다."최고가
          되고 싶다면 날 이겨봐. 하지만 이 무대는 혼자서 오를 수 없어." 눈을
          뜨자, 나는 낯선 세계의 작은 무대 위에 서 있었다. 코요테는 비웃으며
          말했다. "나와 겨룰 준비가 되려면 네 팀을 꾸리고, 각자의 음악으로
          세상을 흔들어 봐. 내 앞에 서기까지 얼마나 버틸 수 있을지 보자고." 나는
          고개를 들고 외쳤다. "내 노래로 당신들을 넘어서고, 세계 최고의 가수가
          될 거야!"
        </div>
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
