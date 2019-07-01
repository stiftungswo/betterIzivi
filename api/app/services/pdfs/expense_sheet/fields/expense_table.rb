# frozen_string_literal: true

module Pdfs
  module ExpenseSheet
    module Fields
      module ExpenseTable
        COLUMN_WIDTHS = [
          20,
          85,
          70,
          70,
          55,
          55,
          55,
          65
        ].freeze

        HEADERS = [
          I18n.t('activerecord.models.attributes.expense_sheet.attributes.pocket_money'),
          I18n.t('activerecord.models.attributes.expense_sheet.attributes.accommodation_expenses'),
          I18n.t('activerecord.models.attributes.service_specification.expense_keys.breakfast'),
          I18n.t('activerecord.models.attributes.service_specification.expense_keys.lunch'),
          I18n.t('activerecord.models.attributes.service_specification.expense_keys.dinner'),
          I18n.t('pdfs.expense_sheet.expense_table.headers.full_amount')
        ].freeze

        DAY_ROWS = [
          {
            count: ->(expense_sheet) { expense_sheet.at_service_start? ? 1 : 0 },
            header_title_key: 'pdfs.expense_sheet.expense_table.row_headers.first_work_days',
            calculation_method: :calculate_first_day
          },
          {
            count: lambda(&:work_days_count),
            header_title_key: 'activerecord.models.attributes.expense_sheet.attributes.work_days',
            calculation_method: :calculate_work_days
          },
          {
            count: ->(expense_sheet) { expense_sheet.at_service_end? ? 1 : 0 },
            header_title_key: 'pdfs.expense_sheet.expense_table.row_headers.last_work_days',
            calculation_method: :calculate_last_day
          },
          {
            count: lambda(&:workfree_days),
            header_title_key: 'activerecord.models.attributes.expense_sheet.attributes.workfree_days',
            calculation_method: :calculate_workfree_days
          },
          {
            count: lambda(&:sick_days),
            header_title_key: 'activerecord.models.attributes.expense_sheet.attributes.sick_days',
            calculation_method: :calculate_sick_days
          },
          {
            count: lambda(&:paid_vacation_days),
            header_title_key: 'activerecord.models.attributes.expense_sheet.attributes.paid_vacation_days',
            calculation_method: :calculate_paid_vacation_days
          },
          {
            count: lambda(&:unpaid_vacation_days),
            header_title_key: 'activerecord.models.attributes.expense_sheet.attributes.unpaid_vacation_days',
            calculation_method: :calculate_unpaid_vacation_days
          }
        ].freeze

        SUPPLEMENT_ROWS = [
          {
            COLUMN_WIDTHS[0..1].sum => '',
            COLUMN_WIDTHS[2..4].sum => ->(expense_sheet) { expense_sheet.unpaid_vacation_comment }
          },
          {
            COLUMN_WIDTHS[0] => '+',
            COLUMN_WIDTHS[1] => I18n.t('activerecord.models.attributes.expense_sheet.attributes.driving_expenses'),
            COLUMN_WIDTHS[2..4].sum => ->(expense_sheet) { expense_sheet.driving_expenses_comment },
            COLUMN_WIDTHS[5..-2].sum => '',
            COLUMN_WIDTHS[-1] => ->(expense_sheet) { format('%.2f', expense_sheet.driving_expenses.to_d / 100) }
          },
          {
            COLUMN_WIDTHS[0] => '+',
            COLUMN_WIDTHS[1] => I18n.t(
              'activerecord.models.attributes.expense_sheet.attributes.work_clothing_expenses'
            ),
            COLUMN_WIDTHS[2..4].sum => ->(expense_sheet) { expense_sheet.driving_expenses_comment },
            COLUMN_WIDTHS[5..-2].sum => '',
            COLUMN_WIDTHS[-1] => ->(expense_sheet) { format('%.2f', expense_sheet.driving_expenses.to_d / 100) }
          }
        ].freeze

        COLUMNS = %i[
          pocket_money
          accommodation
          breakfast
          lunch
          dinner
          total
        ].freeze
      end
    end
  end
end