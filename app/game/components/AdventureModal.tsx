'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateGameAfterAdventure } from '../actions';
import { Game } from '../page';

interface AdventureModalProps {
  game: Game;
}

interface EventType {
  type: string;
  title: string;
  description: string;
  probability: number;
  condition?: (game: Game) => boolean;
}

const EVENTS: EventType[] = [
  {
    type: 'NEW_MEMBER',
    title: '새로운 팀원',
    description:
      '우리 팀에 합류하고 싶다는 면접자가 등장했다! 과연 새로운 팀원이 될 수 있을 것인가?',
    probability: 0.5,
  },
  {
    type: 'ACCIDENT',
    title: '교통사고',
    description:
      '연습을 끝내고 돌아가던 팀원의 갑작스러운 연락! 불길한 예감은 적중했다.. 교통 사고로 인해 손을 다쳐버린 팀원..',
    probability: 0.05,
    condition: (game) => game.number_of_team > 1,
  },
  {
    type: 'DONATION',
    title: '기부금',
    description:
      '누군가에게서 메일이 도착했다. 우리의 공연을 보고 투자를 해주고 싶다는 후원자님!',
    probability: 0.1,
  },
  {
    type: 'HIT_SONG',
    title: '히트곡',
    description:
      '축하합니다! 당신의 아티스트가 발매한 곡이 전 세계 차트를 휩쓸며 1위를 차지했습니다!',
    probability: 0.1,
    condition: (game) => game.fame >= 200,
  },
  {
    type: 'INSTRUMENT_BREAK',
    title: '악기 파손',
    description:
      '예기치 못한 사고가 발생했습니다. 연습실에서 강도 높은 연습 도중 악기가 손상되었습니다.',
    probability: 0.15,
    condition: (game) => {
      return (
        game.main_has_item ||
        game.mate1_has_item ||
        game.mate2_has_item ||
        game.mate3_has_item ||
        game.mate4_has_item
      );
    },
  },
  {
    type: 'CONCERT',
    title: '콘서트 초청',
    description:
      '축하합니다! 당신의 아티스트가 중요한 콘서트에 초청되었습니다. 좋은 결과가 있기를 바랍니다!',
    probability: 0.1,
  },
];

export default function AdventureModal({ game }: AdventureModalProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [eventResult, setEventResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectRandomEvent = () => {
    const availableEvents = EVENTS.filter(
      (event) => !event.condition || event.condition(game)
    );

    const totalProbability = availableEvents.reduce(
      (sum, event) => sum + event.probability,
      0
    );
    let random = Math.random() * totalProbability;

    for (const event of availableEvents) {
      random -= event.probability;
      if (random <= 0) {
        return event;
      }
    }

    return availableEvents[0];
  };

  const openAdventure = () => {
    if (game.random_done) {
      setError('오늘은 이미 모험을 완료했습니다.');
      return;
    }

    const event = selectRandomEvent();
    setSelectedEvent(event);
    setIsModalOpen(true);
    setEventResult(null);
    setError(null);
  };

  const getEventResultMessage = (eventType: string, result: any): string => {
    switch (eventType) {
      case 'NEW_MEMBER':
        return result.number_of_team > game.number_of_team
          ? '새로운 팀원이 합류했습니다! (멘탈 +10)'
          : '팀원 영입에 실패했습니다... (멘탈 -10)';
      case 'ACCIDENT':
        return '팀원이 교통사고로 팀을 떠나게 되었습니다. (멘탈 -30)';
      case 'DONATION':
        const donationAmount = result.money - game.money;
        return `${donationAmount}만원의 후원금을 받았습니다! (멘탈 +10)`;
      case 'HIT_SONG':
        return '노래가 대박 났습니다! (멘탈 MAX, 인기도 +100)';
      case 'INSTRUMENT_BREAK':
        return '악기가 파손되었습니다. 하지만 실력은 늘었습니다! (멘탈 -20, 능력치 +20)';
      case 'CONCERT':
        const mentalChange = result.mental - game.mental;
        const fameChange = result.fame - game.fame;
        return `콘서트가 끝났습니다! (멘탈 ${mentalChange >= 0 ? '+' : ''}${mentalChange}, 인기도 ${fameChange >= 0 ? '+' : ''}${fameChange})`;
      default:
        return '이벤트가 종료되었습니다.';
    }
  };

  const handleAdventure = async () => {
    if (!selectedEvent) return;

    let eventParams = {};

    if (selectedEvent.type === 'ACCIDENT') {
      const availableMembers = [1, 2, 3, 4].filter(
        (i) => game[`mate${i}_name` as keyof Game] !== null
      );
      const randomIndex = Math.floor(Math.random() * availableMembers.length);
      eventParams = { memberKey: `mate${availableMembers[randomIndex]}` };
    } else if (selectedEvent.type === 'INSTRUMENT_BREAK') {
      const availableMembers = [
        'main',
        ...Array(4)
          .fill(0)
          .map((_, i) => `mate${i + 1}`),
      ].filter((key) =>
        key === 'main'
          ? game.main_has_item
          : game[`${key}_has_item` as keyof Game]
      );
      const randomIndex = Math.floor(Math.random() * availableMembers.length);
      eventParams = { memberKey: availableMembers[randomIndex] };
    }

    try {
      const result = await updateGameAfterAdventure(
        game.id,
        selectedEvent.type,
        eventParams
      );
      if (result.error) {
        setError(result.error);
      } else {
        setEventResult(
          getEventResultMessage(selectedEvent.type, result.eventResult)
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Error processing adventure:', error);
      setError('모험 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <button
        onClick={openAdventure}
        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        disabled={game.random_done}
      >
        모험하기
      </button>

      {error && (
        <div className='mt-2 p-2 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-lg w-full mx-4'>
            <h3 className='font-bold text-xl mb-4'>{selectedEvent?.title}</h3>

            <div className='mb-6 text-gray-700'>
              {selectedEvent?.description}
            </div>

            {!eventResult ? (
              <div className='flex justify-end space-x-4'>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className='px-4 py-2 text-gray-600 hover:text-gray-800'
                >
                  취소
                </button>
                <button
                  onClick={handleAdventure}
                  className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                >
                  진행하기
                </button>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='p-4 bg-gray-100 rounded text-center'>
                  {eventResult}
                </div>
                <div className='flex justify-end'>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
