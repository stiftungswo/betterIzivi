# frozen_string_literal: true

class Holiday < ApplicationRecord
  include Concerns::PositiveTimeSpanValidatable
  validates :beginning, :ending, timeliness: { type: :date }
  validates :beginning, :ending, :description, :holiday_type, presence: true

  enum holiday_type: {
    company_holiday: 1,
    public_holiday: 2
  }

  scope :soft_in_date_range, lambda { |beginning, ending|
    where(arel_table[:beginning].lteq(ending)).where(arel_table[:ending].gteq(beginning))
  }

  def work_days(public_holidays = nil)
    return range.reject { |day| day.on_weekend? || day_on_public_holiday?(day, public_holidays) } if company_holiday?

    range.select(&:on_weekday?) if public_holiday?
  end

  def range
    beginning..ending
  end

  private

  # :reek:UtilityFunction
  def day_on_public_holiday?(day, public_holidays)
    public_holidays.any? { |public_holiday| public_holiday.range.include? day }
  end
end
