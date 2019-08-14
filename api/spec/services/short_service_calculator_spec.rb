# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ShortServiceCalculator, type: :service do
  describe '#calculate_ending_date' do
    subject { calculated_ending_day }

    let(:beginning) { Date.parse('2018-01-01') }
    let(:short_service_calculator) { ShortServiceCalculator.new(beginning) }
    let(:required_service_days) { 26 }
    let(:calculated_ending_day) { short_service_calculator.calculate_ending_date(required_service_days) }

    context 'with company holidays' do
      let(:required_service_days) { 7 }

      before do
        create :holiday, beginning: beginning, ending: beginning + 7.days
      end

      it { is_expected.to eq Date.parse('2018-01-16') }
    end

    context 'with public holidays' do
      let(:required_service_days) { 6 }

      before do
        create :holiday, :public_holiday, beginning: beginning, ending: beginning + 1.day
      end

      it { is_expected.to eq Date.parse('2018-01-10') }
    end

    context 'when service days are between 1 and 5' do
      it 'returns correct ending date', :aggregate_failures do
        (1..5).each do |delta|
          ending = short_service_calculator.calculate_ending_date(delta)
          expect(ending).to eq(beginning + delta - 1)
        end
      end
    end

    context 'when service days are 6' do
      let(:required_service_days) { 6 }

      it { is_expected.to eq(beginning + 7) }
    end

    context 'when service days are between 7 and 10' do
      it_behaves_like 'adds one day to linear duration', 7..10
    end

    context 'when service days are 11' do
      let(:required_service_days) { 11 }

      it { is_expected.to eq(beginning + 10) }
    end

    context 'when service days are 12' do
      let(:required_service_days) { 12 }

      it { is_expected.to eq(beginning + 11) }
    end

    context 'when service days are 13' do
      let(:required_service_days) { 13 }

      it { is_expected.to eq(beginning + 14) }
    end

    context 'when service days are between 14 and 17' do
      it_behaves_like 'adds one day to linear duration', 14..17
    end

    context 'when service days are 18' do
      let(:required_service_days) { 18 }

      it { is_expected.to eq(beginning + 17) }
    end

    context 'when service days are 19' do
      let(:required_service_days) { 19 }

      it { is_expected.to eq(beginning + 18) }
    end

    context 'when service days are 20' do
      let(:required_service_days) { 20 }

      it { is_expected.to eq(beginning + 21) }
    end

    context 'when service days are between 21 and 24' do
      it_behaves_like 'adds one day to linear duration', 21..24
    end

    context 'when service days are 25' do
      let(:required_service_days) { 25 }

      it { is_expected.to eq(beginning + 24) }
    end
  end

  describe '#calculate_chargeable_service_days' do
    subject { calculate_chargeable_service_days }

    let(:beginning) { Date.parse('2018-01-01') }
    let(:short_service_calculator) { ShortServiceCalculator.new(beginning) }
    let(:ending) { beginning }
    let(:calculate_chargeable_service_days) { short_service_calculator.calculate_chargeable_service_days(ending) }

    context 'with company holidays' do
      let(:ending) { beginning + 7.days }

      before do
        create :holiday, beginning: beginning, ending: beginning + 7.days
      end

      it { is_expected.to eq 0 }
    end

    context 'with public holidays' do
      let(:ending) { beginning + 9.days }

      before do
        create :holiday, :public_holiday, beginning: beginning, ending: beginning + 1.day
      end

      it { is_expected.to eq 7 }
    end

    context 'when service end is within weekdays of beginning week' do
      it 'returns correct eligible days', :aggregate_failures do
        (0..4).each do |delta|
          service_days = short_service_calculator.calculate_chargeable_service_days(beginning + delta.days)
          expect(service_days).to eq(delta + 1)
        end
      end
    end

    context 'when ending is the monday after one week' do
      let(:ending) { beginning + 1.week }

      it { is_expected.to eq 7 }
    end

    context 'when ending is the tuesday after one week' do
      let(:ending) { beginning + 1.week + 1.day }

      it { is_expected.to eq 8 }
    end

    context 'when ending is the wednesday after one week' do
      let(:ending) { beginning + 1.week + 2.days }

      it { is_expected.to eq 9 }
    end

    context 'when ending is the thursday after one week' do
      let(:ending) { beginning + 1.week + 3.days }

      it { is_expected.to eq 11 }
    end

    context 'when ending is the friday after one week' do
      let(:ending) { beginning + 1.week + 4.days }

      it { is_expected.to eq 12 }
    end

    context 'when ending is the monday after two weeks' do
      let(:ending) { beginning + 2.weeks }

      it { is_expected.to eq 14 }
    end

    context 'when ending is the tuesday after two weeks' do
      let(:ending) { beginning + 2.weeks + 1.day }

      it { is_expected.to eq 15 }
    end

    context 'when ending is the wednesday after two weeks' do
      let(:ending) { beginning + 2.weeks + 2.days }

      it { is_expected.to eq 16 }
    end

    context 'when ending is the thursday after two weeks' do
      let(:ending) { beginning + 2.weeks + 3.days }

      it { is_expected.to eq 18 }
    end

    context 'when ending is the friday after two weeks' do
      let(:ending) { beginning + 2.weeks + 4.days }

      it { is_expected.to eq 19 }
    end

    context 'when ending is the monday after three weeks' do
      let(:ending) { beginning + 3.weeks }

      it { is_expected.to eq 21 }
    end

    context 'when ending is the tuesday after three weeks' do
      let(:ending) { beginning + 3.weeks + 1.day }

      it { is_expected.to eq 22 }
    end

    context 'when ending is the wednesday after three weeks' do
      let(:ending) { beginning + 3.weeks + 2.days }

      it { is_expected.to eq 23 }
    end

    context 'when ending is the thursday after three weeks' do
      let(:ending) { beginning + 3.weeks + 3.days }

      it { is_expected.to eq 25 }
    end
  end
end
