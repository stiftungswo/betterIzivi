# frozen_string_literal: true

module Pdfs
  module ServiceAgreement
    class FirstPage
      include Prawn::View

      def initialize(service)
        @service = service

        font_size 11 do
          indent 30 do
            header
            body
            footer
          end
        end
      end

      private

      def header
        move_down 125
        address_data = [ENV['LETTER_SENDER_NAME'], ENV['LETTER_SENDER_ADDRESS'], ENV['LETTER_SENDER_ZIP_CITY']]

        global_indent = bounds.left
        [20, 275].each do |current_indent|
          global_indent += current_indent

          indent(global_indent) do
            cursor_save do
              draw_address_lines(address_data)
            end
          end
        end
      end

      def body
        move_down 180

        text_box(I18n.t('pdfs.service_agreement.body_content'), leading: 6.5, at: [bounds.left, cursor])
      end

      def footer
        move_down 250

        regional_center = @service.user.regional_center
        address_data = regional_center.address.split ', '

        indent 295 do
          draw_address_lines(address_data, 4.5)
        end
      end

      def document
        @document ||= Prawn::Document.new(page_size: 'A4')
      end

      def cursor_save
        cursor.tap do |old_cursor|
          yield
          move_cursor_to old_cursor
        end
      end

      def draw_address_lines(address_data, leading = 7)
        address_data.map do |address_line|
          text address_line
          move_down leading
        end
      end
    end
  end
end
