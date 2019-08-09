# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Service, type: :model do
  it { is_expected.to validate_presence_of :ending }
  it { is_expected.to validate_presence_of :beginning }
  it { is_expected.to validate_presence_of :user }
  it { is_expected.to validate_presence_of :service_specification }
  it { is_expected.to validate_presence_of :service_type }

  describe 'delegated methods' do
    subject { create :service }

    it { is_expected.to delegate_method(:used_sick_days).to(:used_days_calculator) }
    it { is_expected.to delegate_method(:used_paid_vacation_days).to(:used_days_calculator) }
    it { is_expected.to delegate_method(:remaining_sick_days).to(:remaining_days_calculator) }
    it { is_expected.to delegate_method(:remaining_paid_vacation_days).to(:remaining_days_calculator) }
  end

  it_behaves_like 'validates that the ending is after beginning' do
    let(:model) { build(:service, beginning: beginning, ending: ending) }
  end

  describe '#at_year' do
    subject(:services) { Service.at_year(2018) }

    before do
      create_pair :service, beginning: '2018-11-05', ending: '2018-11-30'
      create :service, beginning: '2017-02-06', ending: '2018-01-05'
      create :service, beginning: '2017-02-06', ending: '2017-02-24'
    end

    it 'returns only services that are at least partially in this year' do
      expect(services.count).to eq 3
    end
  end

  describe '#service_days' do
    let(:service) { build(:service, beginning: beginning, ending: beginning + 25.days) }
    let(:beginning) { Time.zone.today.beginning_of_week }

    it 'returns the service days of the service' do
      expect(service.service_days).to eq 26
    end
  end

  describe '#eligible_paid_vacation_days' do
    let(:service) { build(:service, :long, beginning: beginning, ending: beginning + 214.days) }
    let(:beginning) { Time.zone.today.beginning_of_week }

    it 'returns the eligible personal vacation days of the service' do
      expect(service.eligible_paid_vacation_days).to eq 10
    end
  end

  describe '#eligible_sick_days' do
    let(:service) { build(:service, beginning: beginning, ending: beginning + 25.days) }
    let(:beginning) { Time.zone.today.beginning_of_week }
    let(:service_calculator) { instance_double ServiceCalculator }

    before do
      allow(ServiceCalculator).to receive(:new).and_return service_calculator
      allow(service_calculator).to receive(:calculate_chargeable_service_days).and_return 26
      allow(service_calculator).to receive(:calculate_eligible_sick_days)
    end

    it 'calls ServiceCalculator#calculate_eligible_sick_days' do
      service.eligible_sick_days
      expect(service_calculator).to have_received(:calculate_eligible_sick_days).with 26
    end
  end

  describe '#expense_sheets' do
    subject { service.expense_sheets }

    let(:beginning) { (Time.zone.today - 3.months).beginning_of_week }
    let(:ending) { (Time.zone.today - 1.week).end_of_week - 2.days }

    let(:user) { create :user }
    let(:service) { create(:service, user: user, beginning: beginning, ending: ending) }

    context 'when it has one expense_sheet' do
      let(:expense_sheet) { create :expense_sheet, user: user, beginning: beginning, ending: ending }

      it { is_expected.to eq [expense_sheet] }
    end

    context 'when it has multiple expense_sheets' do
      let(:expense_sheets) { create_list :expense_sheet, 3, user: user, beginning: beginning, ending: ending }

      it { is_expected.to eq expense_sheets }
    end
  end

  describe 'ending_is_friday validation' do
    subject { build(:service, ending: ending).tap(&:validate).errors.added? :ending, :not_a_friday }

    let(:ending) { Time.zone.today.at_end_of_week - 2.days }

    context 'when ending is a friday' do
      it { is_expected.to be false }
    end

    context 'when ending is a saturday' do
      let(:ending) { Time.zone.today.at_end_of_week - 1.day }

      it { is_expected.to be true }
    end
  end

  describe 'beginning_is_monday validation' do
    subject { build(:service, beginning: beginning).tap(&:validate).errors.added? :beginning, :not_a_monday }

    let(:beginning) { Time.zone.today.at_beginning_of_week }

    context 'when beginning is a monday' do
      it { is_expected.to be false }
    end

    context 'when beginning is a tuesday' do
      let(:beginning) { Time.zone.today.at_beginning_of_week + 1.day }

      it { is_expected.to be true }
    end
  end
end
