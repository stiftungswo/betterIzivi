# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Pdfs::ServiceAgreement::GlueService, type: :service do
  describe '#render' do
    context 'when locale is german' do
      around do |spec|
        I18n.with_locale(:de) do
          spec.run
        end
      end

      let(:pdf) { described_class.new(service).render }
      let(:service) { create :service, service_data }
      let(:service_specification) { create :service_specification, identification_number: 82_846 }
      let(:service_data) do
        {
          beginning: Date.parse('2018-01-01'),
          ending: Date.parse('2018-02-23'),
          service_specification: service_specification
        }
      end

      let(:pdf_strings) do
        ClimateControl.modify envs do
          PDF::Inspector::Text.analyze(pdf).strings
        end
      end
      let(:pdf_page_inspector) { PDF::Inspector::Page.analyze(pdf) }

      let(:sender_name) { 'SWO Stiftung Wirtschaft und Öl' }
      let(:sender_address) { 'Hauptstrasse 23d' }
      let(:sender_zip_city) { '9542 Schwerzenbach' }
      let(:envs) do
        {
          SERVICE_AGREEMENT_LETTER_SENDER_NAME: sender_name,
          SERVICE_AGREEMENT_LETTER_SENDER_ADDRESS: sender_address,
          SERVICE_AGREEMENT_LETTER_SENDER_ZIP_CITY: sender_zip_city
        }
      end

      let(:page_text_check_indices) do
        [
          0..2,
          17..19,
          235..239,
          607..607,
          719..719
        ]
      end
      let(:page_text_check_texts) do
        [
          'Einsatzvereinbarung ',
          'Bundesamt für Zivildienst ',
          'Die Unterkunft wird durchgehend angeboten (7 Tage/Woche)   ',
          '07:50 Uhr',
          ' Morgen zwischen 07:15 Uhr und 07:45 Uhr beim Einsatzleiter '
        ]
      end

      it 'renders five pages' do
        expect(pdf_page_inspector.pages.size).to eq 5
      end

      it 'renders pages in correct order', :aggregate_failures do
        page_text_check_indices.each_with_index do |indices, index|
          expect(
            pdf_strings[indices].is_a?(Array) ? pdf_strings[indices].join : pdf_strings[indices]
          ).to eq page_text_check_texts[index]
        end
      end
    end
  end
end
