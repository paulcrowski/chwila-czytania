export const SAMPLE = {
  title: 'Spacer po własnej ulicy',
  language: 'pl',
  pages: [
    'Jeśli chcesz sprawdzić, czy na ulicy dobrze się przebywa, popatrz, kto zostaje na niej dłużej. Zwykłe przejście do sklepu mówi o ulicy co innego niż kwadrans na ławce. Do sklepu idziesz z konieczności. Siadasz zwykle tam, gdzie masz ochotę zostać.\n\nPomyśl o ulicy, którą dobrze znasz. Gdzie byś usiadł, gdybyś miał dziesięć minut czekania?',
    'Wyobraź sobie dwie ławki. Jedna stoi na środku placu, druga przy ścianie, skąd widać wejście do piekarni. Nawet przy tej samej pogodzie możesz wybrać drugą. Masz oparcie za plecami i coś do oglądania. Bliskość piekarni sprawia, że obok ktoś co chwilę przechodzi.\n\nPrzy następnym spacerze zwróć uwagę, skąd najłatwiej obserwować ulicę, i sprawdź, czy ktoś już zajął to miejsce.',
    'Na spacerze można zrobić mały eksperyment. Usiądź na pięć minut przy ulicy, którą zwykle przechodzisz. Policz, ile osób po drodze się zatrzymuje. Zauważ, co robią. Ktoś poprawia sznurówkę, ktoś wybiera bułki, ktoś macha do sąsiada po drugiej stronie.\n\nPotem przejdź na kolejną ulicę i powtórz ćwiczenie. Różnica między ulicami bywa bardziej widoczna z ławki niż zza szyby samochodu.',
  ],
};

const SAMPLE_EN = {
  title: 'A Walk Down Your Own Street',
  language: 'en',
  pages: [
    'If you want to know whether a street is a pleasant place to be, watch who stays on it. A trip to the shop tells you something different from fifteen minutes on a bench. You go to the shop because you need something. You usually sit where you feel like staying.\n\nThink of a street you know well. Where would you sit if you had ten minutes to wait?',
    'Imagine two benches. One is in the middle of a square. The other is against a wall, with a view of the bakery door. Even in the same weather, you might choose the second. You have something behind you and something to watch. People pass every few moments on their way to the bakery.\n\nNext time you go for a walk, notice where it is easiest to watch the street. See if somebody has already taken that spot.',
    'Try a small experiment on a walk. Sit for five minutes beside a street you normally just walk along. Count how many people stop and notice what they do. Someone reties a shoelace. Someone picks out bread rolls. Someone waves to a neighbour across the street.\n\nThen try the same thing on another street. The difference between the two can be easier to see from a bench than through a car window.',
  ],
};

export function sampleFor(language) {
  return language === 'en' ? SAMPLE_EN : SAMPLE;
}
