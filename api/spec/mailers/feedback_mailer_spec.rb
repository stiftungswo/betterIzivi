# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FeedbackMailer, type: :mailer do
  describe 'feedback_reminder_mail' do
    let(:service) { build_stubbed :service, user: build_stubbed(:user) }
    let(:mail) { described_class.feedback_reminder_mail(service) }
    let(:envs) do
      {
        FEEDBACK_MAIL_SURVEY_URL: 'http://example.com?service_id=%<service_id>s',
        FEEDBACK_MAIL_TESTIMONIAL_URL: 'https://naturzivi.ch/testimonial',
        FEEDBACK_MAIL_GOOGLE_REVIEW_URL: 'https://g.page/r/Ceus2ke10hBiEAg/review',
        MAIL_SENDER: 'from@example.com'
      }
    end

    around do |spec|
      I18n.with_locale(:de) do
        spec.run
      end
    end

    describe 'header' do
      it 'renders the headers' do
        ClimateControl.modify envs do
          expect(mail.subject).to eq I18n.t('feedback_mailer.feedback_reminder_mail.subject')
          expect(mail.to).to eq([service.user.email])
          expect(mail.from).to eq(['from@example.com'])
        end
      end
    end

    describe 'body' do
      let(:link) { "http://example.com?service_id=#{service.id}" }

      it 'contains the correct parts', :aggregate_failures do
        ClimateControl.modify envs do
          expect(mail.body.encoded).to match("Lieber #{service.user.full_name}")
          expect(mail.text_part.decoded).to include link
          expect(mail.html_part.decoded).to include link
        end
      end
    end
  end
end
