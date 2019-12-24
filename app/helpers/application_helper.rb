module ApplicationHelper

  def distance_to_now_in_words(datetime)
    if datetime
      return distance_of_time_in_words_to_now(datetime) + ' ago'
    else
      return ''
    end
  end

  def breadcrumb_links_for(document)
    links = []
    case document
    when Run
      links = breadcrumb_links_for(document.parameter_set)
      links << link_to("Run:#{document.id}", run_path(document))
    when ParameterSet
      links = breadcrumb_links_for(document.simulator)
      links << link_to("PS:#{document.id}", parameter_set_path(document))
    when Simulator
      links = [ link_to("Simulators", simulators_path) ]
      links << link_to(document.name, simulator_path(document))
    when Analysis
      links = breadcrumb_links_for(document.analyzable)
      links << "Analysis:#{document.id}"
    when Analyzer
      links = breadcrumb_links_for(document.simulator)
      links << "Analyzer:#{document.name}"
    else
      raise "not supported type"
    end
    return links
  end

  def progress_bar(counts)
    percent_finished = 0.0
    percent_failed = 0.0
    percent_running = 0.0
    percent_submitted = 0.0
    total = counts.values.inject(:+)
    if total > 0
      percent_finished = ( counts[:finished].to_f / total.to_f * 100 ).round
      percent_failed = ( counts[:failed].to_f / total.to_f * 100 ).round
      percent_running = ( counts[:running].to_f / total.to_f * 100 ).round
      percent_submitted = ( counts[:submitted].to_f / total.to_f * 100 ).round
    end

    tags = <<-EOS
      <div class="progress" data-toggle="tooltip" data-html="true" data-placement="bottom" data-original-title='#{progress_bar_tooltip(counts)}'>
        #{progress_bar_tag_for('success', percent_finished)}
        #{progress_bar_tag_for('danger', percent_failed)}
        #{progress_bar_tag_for('warning', percent_running)}
        #{progress_bar_tag_for('info', percent_submitted)}
      </div>
    EOS
    raw(tags)
  end

  def shortened_id_monospaced(id)
    raw( '<tt class="short-id">' + shortened_id(id) + '</tt>' )
  end

  def shortened_id(id)
    str = id.to_s
    str[5..7] + str[-3..-1]
  end

  def shortened_job_id(job_id)
    short = job_id.to_s
    short = short[0..5] + ".." if short.length > 6
    short
  end

  private
  MIN_PERCENT_TO_PRINT = 5
  def progress_bar_tag_for(status, percent)
    content = percent > MIN_PERCENT_TO_PRINT ? "#{percent}%" : ""
    tag = <<-EOS
      <div class="progress-bar progress-bar-#{status}" style="width: #{percent}%">#{content}</div>
    EOS
  end

  def progress_bar_tooltip(counts)
    tag = ""
    [:finished,:failed,:running,:submitted,:created].each do |stat|
      tag += "<div>#{status_label(stat)}<span id=\"#{stat}_count\">#{counts[stat]}</span></div>"
    end
    tag
  end

  # to prevent UTF-8 parameter from being added in the URL for GET requests
  # See http://stackoverflow.com/questions/4104474/rails-3-utf-8-query-string-showing-up-in-url
  def utf8_enforcer_tag
    return "".html_safe
  end

  def link_to_add_fields(name, f, association, partial = nil)
    new_object = f.object.send(association).klass.new
    id = new_object.object_id
    fields = f.fields_for(association, new_object, child_index: id) do |builder|
      partial ||= association.to_s.singularize + "_fields"
      render(partial, f: builder)
    end
    link_to(name, '#', class: "add_fields", data: {id: id, fields: fields.gsub("\n", "")})
  end

  def bootstrap_flash
    flash_messages = []
    flash.each do |type, message|
      next if message.blank?

      type = type.to_sym
      type = :success if type == :notice
      type = :danger  if type == :alert
      type = :danger  if type == :error
      next unless [:success, :info, :warning, :danger].include?(type)

      tag_options = {
          class: "alert fade in alert-#{type}"
      }

      close_button = content_tag(:button, raw("&times;"), type: "button", class: "close", "data-dismiss" => "alert")

      Array(message).each do |msg|
        text = content_tag(:div, close_button + msg, tag_options)
        flash_messages << text if msg
      end
    end
    flash_messages.join("\n").html_safe
  end

  def tooltip_data(*json_path)
    json = TOOLTIP_DESCS
    title = json.dig(*json_path.map(&:to_s))
    {html: 'true', toggle: 'tooltip', placement: 'right', 'original-title': title}
  end

  def label_c(text)
    content_tag(:label, text, class: "col-md-2 control-label")
  end

  def query_badge(filter)
    query_tag = ""
    filter.conditions.each_with_index do |c,idx|
      if idx > 10
        query_tag << '<span class="badge badge-pill badge-info margin-half-em">...</span>'
      else
        query_tag << '<span class="badge badge-pill badge-info margin-half-em">' + ParameterSetFilter.format(c) + '</span>'
      end
    end
    query_tag
  end
end


