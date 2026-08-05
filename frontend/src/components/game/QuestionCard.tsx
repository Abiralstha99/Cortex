import "./QuestionCard.css";

type QuestionCardProps = {
  question: string;
  options: string[];
  onSubmit: (index: number) => void;
  disabled: boolean;
  selectedIndex: number | null;
};

export default function QuestionCard({
  question,
  options,
  onSubmit,
  disabled,
  selectedIndex,
}: QuestionCardProps) {
  return (
    <div className="question-card">
      <h2 className="question-card__text">{question}</h2>
      <div className="question-card__options">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            className={`question-card__option ${
              selectedIndex === index ? "question-card__option--selected" : ""
            }`}
            onClick={() => onSubmit(index)}
            disabled={disabled}
          >
            <span className="question-card__letter">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="question-card__option-text">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
