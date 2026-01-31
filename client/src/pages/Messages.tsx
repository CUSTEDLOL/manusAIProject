import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MessageCircle, Inbox, Send, Calendar } from "lucide-react";
import { Link } from "wouter";

/**
 * Messages / Activity page - displays WhatsApp message log from CSV data
 * Uses Messages_Log.csv for message history
 */
export default function Messages() {
  const { data: messages, isLoading } = trpc.messages.list.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 to-emerald-50/30">
      <header className="bg-white border-b border-green-100 sticky top-0 z-10 shadow-sm">
        <div className="container py-4">
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-green-900">Messages & Activity</h1>
          <p className="text-sm text-green-600">
            WhatsApp message log from Matsu-Mind integration
          </p>
        </div>
      </header>

      <main className="container py-8">
        {/* Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {messages?.length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Inbox className="h-4 w-4 text-blue-600" />
                Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-blue-900 capitalize">
                {messages?.[0]?.channel ?? "—"}
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last Intent</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-purple-800">
                {messages?.[0]?.intent ?? "—"}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Send className="h-4 w-4 text-orange-600" />
                Outcome
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-orange-900 capitalize">
                {messages?.[0]?.outcome ?? "—"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message List */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Message Log
            </CardTitle>
            <CardDescription>
              Inbound and outbound messages from Matsu-Mind (data/Matsu-Mind - Messages_Log.csv)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages in log yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add rows to data/Matsu-Mind - Messages_Log.csv to see activity here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.msg_id || idx}
                    className="p-4 rounded-lg border border-green-100 bg-green-50/50"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize">
                          {msg.channel || "whatsapp"}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {msg.direction || "inbound"}
                        </Badge>
                        <Badge variant={msg.intent === "UNKNOWN" ? "destructive" : "default"}>
                          {msg.intent || "—"}
                        </Badge>
                        {msg.is_voice === "true" && (
                          <Badge variant="outline">Voice</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {msg.ts ? new Date(msg.ts).toLocaleString() : "—"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                      {msg.from_id && <span>From: {msg.from_id}</span>}
                      {msg.to_id && <span>To: {msg.to_id}</span>}
                    </div>
                    {msg.body && (
                      <p className="text-sm text-green-900 mt-2 p-2 bg-white rounded border">
                        {msg.body}
                      </p>
                    )}
                    {msg.outcome && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Outcome: <span className="font-medium">{msg.outcome}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
