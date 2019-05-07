# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RegionalCentersController, type: :request do
  describe '#index' do
    subject { response }

    let(:regional_center) { create :regional_center }
    let(:response_json) { JSON.parse(response.body, symbolize_names: true) }

    before do
      regional_center

      get regional_centers_path
    end

    it { is_expected.to be_successful }

    it 'returns one regional center' do
      expect(response_json.length).to be 1
    end

    it 'has all attributes' do
      expect(response_json.first).to include(
        id: regional_center.id,
        name: regional_center.name,
        address: regional_center.address,
        short_name: regional_center.short_name
      )
    end
  end
end
