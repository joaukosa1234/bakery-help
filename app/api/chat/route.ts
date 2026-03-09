export default function LexAutoFrontendMock() {
  const navItems = [
    "Home",
    "About Us",
    "Services",
    "Pricing & Coupons",
    "Blog",
    "Gallery",
    "Testimonials",
    "FAQ",
    "Shop",
    "Contacts",
  ];

  const faqs = [
    {
      question:
        "I HAVE A NEW CAR; DO I NEED TO TAKE IT TO A DEALERSHIP FOR MAINTENANCE IN ORDER TO KEEP MY WARRANTY VALID?",
      answer:
        "No. As long as you follow the manufacturer's maintenance schedule in your owner's manual, your warranty remains valid. Independent shops can perform this work as long as the service is done properly and documented.",
    },
    {
      question: "WHAT DO I HAVE TO DO TO KEEP MY CAR OR TRUCK'S WARRANTY IN EFFECT?",
      answer:
        "Service your vehicle at the intervals listed in the owner's manual and keep clear maintenance records, including the date, mileage, VIN, and parts installed on the invoice.",
      highlight: true,
    },
    {
      question: "MY CAR IS A LEASED VEHICLE. AM I RESPONSIBLE FOR MAINTENANCE?",
      answer:
        "Yes. Even if you lease a vehicle, you are still responsible for the maintenance and repairs required to keep it in good working order according to the owner's manual.",
    },
    {
      question:
        "WHAT PARTS SHOULD BE REPLACED AND AT WHAT INTERVALS SHOULD THESE SERVICES BE PERFORMED?",
      answer:
        "Check your owner's manual for the exact service intervals and any severe-service notes. Following the manufacturer's schedule is the best way to protect both the vehicle and the warranty.",
    },
    {
      question:
        "WHAT IF MY NEW CAR NEEDS REPAIRS OTHER THAN REGULARLY SCHEDULED MAINTENANCE SUCH AS A BRAKE JOB OR OTHER REPAIRS? DO I HAVE TO RETURN TO THE DEALER FOR THESE REPAIRS? WHAT IF THESE REPAIRS ARE COVERED UNDER MY WARRANTY?",
      answer:
        "You can choose where to have most repairs done, but repairs covered under the manufacturer's warranty may still need to be handled by the dealer. Review the warranty booklet carefully for the exact rules.",
    },
    {
      question: "DOES BRAKE FLUID REALLY NEED TO BE CHANGED?",
      answer:
        "Yes. Brake fluid absorbs moisture over time, which can lead to internal corrosion and reduced braking performance. Periodic brake fluid service helps protect the hydraulic system.",
    },
    {
      question: "HOW OFTEN SHOULD ANTIFREEZE BE REPLACED?",
      answer:
        "Coolant replacement intervals vary by vehicle, but fresh coolant is important for corrosion protection, water pump lubrication, and temperature control. Always follow the owner's manual.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#ececec] text-black">
      <TopStrip />
      <Header />

      <nav className="mx-auto flex w-full max-w-[1500px] items-center bg-[#efefef] px-6 py-0 shadow-sm">
        {navItems.map((item) => (
          <button
            key={item}
            className={`border-r border-transparent px-5 py-7 text-[19px] font-medium transition hover:bg-[#f8f8f8] ${
              item === "FAQ" ? "bg-[#f1d400]" : ""
            }`}
          >
            {item}
          </button>
        ))}
        <div className="ml-auto text-4xl text-[#444]">⌕</div>
      </nav>

      <Hero />

      <main className="mx-auto max-w-[1500px] px-6 pb-16 pt-12">
        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <FaqCard key={index} {...faq} />
          ))}
        </div>
      </main>

      <Footer />

      <button className="fixed bottom-6 right-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f1d400] text-4xl shadow-2xl transition hover:scale-105">
        🚗
      </button>
    </div>
  );
}

function TopStrip() {
  return (
    <div className="bg-[#0f0f0f] text-white">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-3 text-[15px] md:text-[18px]">
        <div className="font-light tracking-wide">
          Monday-Saturday <span className="text-[#f1d400]">10:00AM - 6:30PM</span>
        </div>
        <button className="rounded-bl-[38px] rounded-tl-none rounded-tr-none bg-[#f1d400] px-10 py-4 text-[17px] font-semibold text-black md:text-[20px]">
          ➜ APPOINTMENT
        </button>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-gradient-to-r from-[#0e0e0e] via-[#1a1a1a] to-[#2d2d2d] text-white">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-6 py-7 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[56px] font-black uppercase leading-none tracking-tight text-[#f1d400] md:text-[64px]">
            Lex Auto
          </div>
          <div className="-mt-1 text-[22px] uppercase tracking-[0.22em] text-white/90">
            Solutions
          </div>
        </div>

        <div className="text-right">
          <div className="text-[18px] uppercase tracking-wide text-white/90 md:text-[22px]">
            Schedule your appointment today
          </div>
          <div className="mt-1 text-[40px] font-light tracking-wide md:text-[58px]">
            604-303-9020
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#1a1a1a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.07),transparent_55%)]" />
      <div className="mx-auto max-w-[1500px] px-6 py-16 md:py-24">
        <div className="mb-6 text-[16px] text-white/90 md:text-[18px]">Home / Frequently Asked Question</div>
        <h1 className="text-[46px] font-light leading-none text-white md:text-[80px]">
          Frequently <span className="font-medium text-[#f1d400]">Asked Question</span>
        </h1>
        <p className="mt-5 max-w-[1100px] text-[17px] leading-8 text-white/75 md:text-[22px]">
          At Lex Auto Solutions we want to make servicing as simple, and hassle free as possible. Below are some frequently asked questions. If your question isn't listed below, please do not hesitate to contact our Customer Service team on 604-303-9020.
        </p>
      </div>
    </section>
  );
}

type FaqCardProps = {
  question: string;
  answer: string;
  highlight?: boolean;
};

function FaqCard({ question, answer, highlight }: FaqCardProps) {
  return (
    <section className="border-t border-[#e0cb2b] bg-[#ececec]">
      <div className="flex flex-col gap-6 py-9 md:flex-row md:gap-10">
        <div className="flex h-[118px] w-[118px] shrink-0 items-center justify-center bg-[#f1d400] text-[56px] font-light leading-none text-black">
          −
        </div>

        <div className="max-w-[1260px] pt-1">
          <h2
            className={`max-w-[1200px] text-[26px] font-medium uppercase leading-tight md:text-[30px] ${
              highlight ? "text-[#e2bf00]" : "text-black"
            }`}
          >
            {question}
          </h2>
          <p className="mt-8 max-w-[1300px] text-[18px] leading-[1.75] text-[#222] md:text-[24px]">
            {answer}
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-10 bg-[#212121] text-white">
      <div className="mx-auto max-w-[1500px] px-6 py-20">
        <div className="text-[28px] md:text-[48px]">
          Call: <span className="font-semibold text-[#f1d400]">604-303-9020</span>
        </div>

        <div className="mt-12 grid gap-8 text-[18px] md:text-[28px]">
          <div className="flex items-start gap-5">
            <div className="text-[#f1d400]">📍</div>
            <div>5-11220 Voyageur Way, Richmond BC V6X 3E1</div>
          </div>
          <div className="flex items-start gap-5">
            <div className="text-[#f1d400]">🕘</div>
            <div>
              <div>
                Monday-Saturday <span className="text-[#f1d400]">10:00AM - 6:30PM</span>
              </div>
              <div>Sunday Closed</div>
            </div>
          </div>
          <div className="flex items-start gap-5">
            <div className="text-[#f1d400]">✉️</div>
            <div>sales@lexauto.org</div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          {["f", "t", "g+", "▶", "◎", "t", "Be", "in"].map((icon) => (
            <div
              key={icon}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1d400] text-[24px] font-semibold text-black"
            >
              {icon}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black px-6 py-7 text-center text-[16px] text-white/90 md:text-[18px]">
        © 2021 Lex Auto Solutions, All Rights Reserved
      </div>
    </footer>
  );
}