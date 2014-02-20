json.array!(@graphs) do |graph|
  json.extract! graph, :id
  json.url graph_url(graph, format: :json)
end
