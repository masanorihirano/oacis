class SimulatorsController < ApplicationController
  # GET /simulators
  # GET /simulators.json
  def index
    @simulators = Simulator.all
    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @simulators }
    end
  end

  # GET /simulators/1
  # GET /simulators/1.json
  def show
    @simulator = Simulator.find(params[:id])
    @analyzers = @simulator.analyzers
    @query_id = params[:query_id]
    if @query_id.blank?
      @param_sets = ParameterSet.where(:simulator_id => @simulator).page(params[:page])
    else
      @param_sets = ParameterSet.where(:simulator_id => @simulator).where(ParameterSetQuery.where(:id => @query_id).first.selector).page(params[:page])
    end
    unless @simulator.parameter_set_querys.blank?
      keyary = []
      keyval = []
      @simulator.parameter_set_querys.each do |psq|
        keyary << psq.query.to_s
        keyval << psq.id
      end
      ary = [keyary, keyval].transpose
      @query_list = Hash[*ary.flatten]
    end

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @simulator }
    end
  end

  # GET /simulators/new
  # GET /simulators/new.json
  def new
    @simulator = Simulator.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @simulator }
    end
  end

  # GET /simulators/1/edit
  # def edit
  #   @simulator = Simulator.find(params[:id])
  # end

  # POST /simulators
  # POST /simulators.json
  def create
    param_def = {}
    if params.has_key?(:definitions)
      params[:definitions].each do |defn|
        name = defn[:name]
        next if name.empty?
        param_def[name] = {}
        param_def[name]["type"] = defn["type"]
        param_def[name]["default"] = defn["default"]
        param_def[name]["description"] = defn["description"]
      end
    end
    @simulator = Simulator.new(params[:simulator])
    @simulator.parameter_definitions = param_def

    respond_to do |format|
      if @simulator.save
        format.html { redirect_to @simulator, notice: 'Simulator was successfully created.' }
        format.json { render json: @simulator, status: :created, location: @simulator }
      else
        format.html { render action: "new" }
        format.json { render json: @simulator.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /simulators/1
  # PUT /simulators/1.json
  # def update
  #   @simulator = Simulator.find(params[:id])

  #   respond_to do |format|
  #     if @simulator.update_attributes(params[:simulator])
  #       format.html { redirect_to @simulator, notice: 'Simulator was successfully updated.' }
  #       format.json { head :no_content }
  #     else
  #       format.html { render action: "edit" }
  #       format.json { render json: @simulator.errors, status: :unprocessable_entity }
  #     end
  #   end
  # end

  # DELETE /simulators/1
  # DELETE /simulators/1.json
  # def destroy
  #   @simulator = Simulator.find(params[:id])
  #   @simulator.destroy

  #   respond_to do |format|
  #     format.html { redirect_to simulators_url }
  #     format.json { head :no_content }
  #   end
  # end

  # POST /simulators/:_id/_make_query redirect_to simulators#show
  def _make_query
    @query_id = params[:query_id]
    if params[:delete_query]
      @q = ParameterSetQuery.where(:id => @query_id).first
      @q.destroy
      @query_id = ""
    else
      @simulator = Simulator.find(params[:id])
      @newquery = ParameterSetQuery.new
      @newquery.simulator = @simulator
      if @newquery.set_query(params["query"])
        if @newquery.save
          @simulator.parameter_set_querys << @newquery #@simulator is updated
          @query_id = @newquery.id
        end
      else
        @newquery.destroy
      end
    end

    redirect_to  :action => "show", :query_id => @query_id
  end
end
