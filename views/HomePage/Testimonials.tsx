import styled from 'styled-components';

import Container from 'components/Container';
import Separator from 'components/Separator';
// import { A11y, Autoplay, Navigation } from 'swiper';
// import { Swiper, SwiperSlide } from 'swiper/react';
import { media } from 'utils/media';

const TESTIMONIALS = [
  {
    companyLogoUrl: '/testimonials/autoservice-logo-1.svg',
    content: `Установили фильтр RailGuard на Renault Kangoo с ТНВД Delphi DFP1. За 6 месяцев и 15000 км пробега ни одной проблемы с форсунками. Фильтр реально работает - при проверке видно собранную стружку.`,
    author: {
      name: 'Михаил Петров',
      title: 'Главный механик, АвтоДизель Сервис',
      avatarUrl: '/testimonials/mechanic-1.jpg',
    },
  },
  {
    companyLogoUrl: '/testimonials/autoservice-logo-2.svg',
    content: `Как владелец SsangYong Kyron намучался с форсунками. После установки RailGuard прошел уже 30000 км - полет нормальный. Фильтр окупился в первые же месяцы использования.`,
    author: {
      name: 'Александр Иванов',
      title: 'Владелец SsangYong Kyron 2.0',
      avatarUrl: '/testimonials/owner-1.jpg',
    },
  },
  {
    companyLogoUrl: '/testimonials/autoservice-logo-3.svg',
    content: `Профессионально занимаемся ремонтом дизельных двигателей. RailGuard - отличное решение для защиты топливной системы. Рекомендуем всем клиентам после ремонта ТНВД для предотвращения повторных проблем.`,
    author: {
      name: 'Дмитрий Сергеев',
      title: 'Директор, ДизельМастер',
      avatarUrl: '/testimonials/expert-1.jpg',
    },
  },
];

export default function Testimonials() {
  return (
    <div>
      <Separator />
      <TestimonialsWrapper>{/* Swiper временно отключён */}</TestimonialsWrapper>
      <Separator />
    </div>
  );
}

const TestimonialsWrapper = styled(Container)`
  position: relative;

  .swiper-button-prev,
  .swiper-button-next {
    color: rgb(var(--secondary));

    ${media('<=desktop')} {
      display: none;
    }
  }

  .swiper-button-prev {
    color: rgb(var(--textSecondary));
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2027%2044'%3E%3Cpath%20d%3D'M0%2C22L22%2C0l2.1%2C2.1L4.2%2C22l19.9%2C19.9L22%2C44L0%2C22L0%2C22L0%2C22z'%20fill%3D'%23currentColor'%2F%3E%3C%2Fsvg%3E");
  }

  .swiper-button-next {
    color: rgb(var(--textSecondary));
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2027%2044'%3E%3Cpath%20d%3D'M27%2C22L27%2C22L5%2C44l-2.1-2.1L22.8%2C22L2.9%2C2.1L5%2C0L27%2C22L27%2C22z'%20fill%3D'%23currentColor'%2F%3E%3C%2Fsvg%3E");
  }
`;

const TestimonialCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  & > *:not(:first-child) {
    margin-top: 5rem;
  }
`;

const Content = styled.blockquote`
  text-align: center;
  font-size: 2.2rem;
  font-weight: bold;
  font-style: italic;
  max-width: 60%;

  ${media('<=desktop')} {
    max-width: 100%;
  }
`;

const AuthorContainer = styled.div`
  display: flex;
  align-items: center;
`;

const AuthorContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 1.4rem;
`;

const AuthorTitle = styled.p`
  font-weight: bold;
`;

const AuthorName = styled.p`
  font-weight: normal;
`;

const AuthorImageContainer = styled.div`
  display: flex;
  border-radius: 10rem;
  margin-right: 1rem;
  overflow: hidden;
`;
