class AnalysisRun
  include Mongoid::Document
  include Mongoid::Timestamps

  field :parameters, type: Hash
  field :status, type: Symbol
  field :hostname, type: String
  field :cpu_time, type: Float
  field :real_time, type: Float
  field :started_at, type: DateTime
  field :finished_at, type: DateTime
  field :included_at, type: DateTime
  field :result

  belongs_to :analyzer
  def analyzer  # find embedded document
    analyzer = nil
    if analyzer_id and analyzable
      analyzable.simulator.analyzers.find(analyzer_id)
    end
  end
  embedded_in :analyzable, polymorphic: true

  before_validation :set_status
  validates :parameters, presence: true
  validates :status, presence: true,
                     inclusion: {in: [:created,:running,:including,:failed,:canceled,:finished]}
  validates :analyzable, :presence => true
  validates :analyzer, :presence => true
  validate :cast_and_validate_parameter_values

  attr_accessible :parameters, :analyzer

  public
  def update_status_running(option = {hostname: 'localhost'})
    merged = {hostname: 'localhost'}.merge(option)
    self.status = :running
    self.hostname = option[:hostname]
    self.started_at = DateTime.now
    self.save
  end

  def update_status_including(option = {cpu_time: 0.0, real_time: 0.0})
    merged = {cpu_time: 0.0, real_time: 0.0}.merge(option)
    self.status = :including
    self.cpu_time = merged[:cpu_time]
    self.real_time = merged[:real_time]
    self.result = merged[:result]
    self.finished_at = DateTime.now
    self.save
  end

  def update_status_finished
    self.status = :finished
    self.included_at = DateTime.now
    self.save
  end

  private
  def set_status
    self.status ||= :created
  end

  def cast_and_validate_parameter_values
    unless parameters.is_a?(Hash)
      errors.add(:parameters, "parameters is not a Hash")
      return
    end

    return unless analyzer
    defn = analyzer.parameter_definitions
    casted = ParametersUtil.cast_parameter_values(parameters, defn)
    if casted.nil?
      errors.add(:parameters, "parameters are invalid. See the definition.")
      return
    end
    self.parameters = casted
  end
end
